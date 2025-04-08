import { Brackets } from "typeorm";
import { convertArrayOfStringIntoStringNumber } from "../utils/functions";
import { FILTER_OPERATION_PREFIX } from "./constants";
import { GraphqlFilterFieldMetadata } from "./decorators/field.decorator";
import { IFilterDecoratorParams } from "./decorators/resolver.decorator";
import { IFilter, OperationQuery } from "./input-type-generator";

/**
 * Enum defining the types of logical operations that can be used in filter queries
 */
export enum EOperationType {
  AND,
  OR
}

/**
 * Converts filter parameters into TypeORM query brackets
 * This function handles the conversion of GraphQL filter parameters into TypeORM query conditions
 * 
 * @template T - The type of the entity being filtered
 * @param {IFilter<T>[]} parameters - Array of filter parameters
 * @param {EOperationType} [opType=EOperationType.AND] - The logical operation type (AND/OR)
 * @param {Map<string, GraphqlFilterFieldMetadata>} [customFields] - Custom field metadata
 * @param {IFilterDecoratorParams} [options] - Additional filter options
 * @returns {Brackets} TypeORM Brackets object containing the query conditions
 */
export const convertFilterParameters = <T>(parameters?: IFilter<T>[], opType: EOperationType = EOperationType.AND, customFields?: Map<string, GraphqlFilterFieldMetadata>, options?: IFilterDecoratorParams) => {
  // Handle direct Brackets input (for testing or global pipes)
  if ((parameters as any)?.whereFactory) return parameters;

  // Remove undefined filters
  parameters = parameters.filter(x => x !== undefined);

  return new Brackets((qb) => {
    if (parameters == null) {
      return;
    }

    // Process each filter operation
    for (const op of parameters) {
      // Handle nested AND operations
      if (op.and) {
        const innerBrackets = convertFilterParameters<T>(op.and, EOperationType.AND, customFields, options);
        if (innerBrackets instanceof Brackets) {
          qb.andWhere(innerBrackets)
        }
      }

      // Handle nested OR operations
      if (op.or) {
        const innerBrackets = convertFilterParameters<T>(op.or, EOperationType.OR, customFields, options);
        if (innerBrackets instanceof Brackets) {
          qb.orWhere(innerBrackets)
        }
      }

      // Process basic filter operations
      const clonnedOp = {...op};
      delete clonnedOp.and;
      delete clonnedOp.or;

      const basicParameters = recursivelyTransformComparators(clonnedOp, customFields, options?.sqlAlias);
      if (basicParameters) {
        for (const query of basicParameters) {
          if (opType === EOperationType.AND) {
            qb.andWhere(query[0], query[1]);
          } else {
            qb.orWhere(query[0], query[1]);
          }
        }
      }
    }
  });
}

/**
 * Recursively transforms filter comparators into SQL conditions
 * This function converts object-based filter conditions into SQL WHERE clauses
 * 
 * @param {Record<string, any>} object - The filter object to transform
 * @param {Map<string, GraphqlFilterFieldMetadata>} [extendedParams] - Extended field parameters
 * @param {string} [sqlAlias] - SQL table alias
 * @returns {[string, any][] | null} Array of SQL conditions and parameters, or null if no conditions
 */
const recursivelyTransformComparators = (object: Record<string, any>, extendedParams?: Map<string, GraphqlFilterFieldMetadata>, sqlAlias?: string) => {
  if (!object || !Object.entries(object).length) return null;
  const typeormWhereQuery = [];
  
  // Process each field in the filter object
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === "object") {
      const operators = Object.entries(value as Record<string, any>);
      
      // Ensure only one operator per attribute
      if (operators.length > 1) {
        throw new Error('Inside filter statement should be only one condition operator for each attribute');
      }

      // Process each operator
      for (const [innerKey, innerValue] of operators) {
        const operatorKey = innerKey.replace(FILTER_OPERATION_PREFIX, '');
        
        // Handle custom field definitions
        if (extendedParams.has(key)) {
          const field = extendedParams.get(key);
          const rightExpression = field.sqlExp ? field.sqlExp : (sqlAlias ? `${sqlAlias}.${field.name}` : field.name);
          typeormWhereQuery.push(buildSqlArgument(operatorKey, rightExpression, innerValue));
        } else {
          const rightExpression = sqlAlias ? `${sqlAlias}.${key}` : key;
          typeormWhereQuery.push(buildSqlArgument(operatorKey, rightExpression, innerValue));
        }
      }
    }
  }
  return typeormWhereQuery;
}

/**
 * Builds SQL arguments for different comparison operations
 * This function converts operator types into actual SQL conditions with parameters
 * 
 * @param {string} operatorKey - The operator type (eq, neq, lt, etc.)
 * @param {string} field - The field name to compare
 * @param {any} value - The value to compare against
 * @returns {[string, any]} Tuple containing the SQL condition and its parameters
 */
const buildSqlArgument = (operatorKey: string, field: string, value: any) => {
  let result = [];
  // Generate a unique parameter name to avoid conflicts
  const argName = `arg_${convertArrayOfStringIntoStringNumber([field])}_${Math.floor(Math.random() * 1e6)}`

  // Handle different comparison operators
  if (operatorKey === OperationQuery.eq) {
    if (value === null || value === 'null') {
      result = [`${field} is null`];
    } else {
      result = [`${field} = :${argName}`, { [argName]: value }];
    }
  } else if (operatorKey === OperationQuery.neq) {
    if (value === null || value === 'null') {   
      result = [`${field} != :${argName}`, { [argName]: value }];
    } else {
      result = [`${field} is not null`];
    }
  } else if (operatorKey === OperationQuery.lt) {
    result = [`${field} < :${argName}`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.lte) {
    result = [`${field} <= :${argName}`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.gt) {
    result = [`${field} > :${argName}`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.gte) {
    result = [`${field} >= :${argName}`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.like) {
    result = [`${field}::varchar ilike :${argName}::varchar`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.notlike) {
    result = [`${field}::varchar not ilike :${argName}::varchar`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.between) {
    result = [`${field} between :${argName}1 and :${argName}2`, { [`${argName}1`]: value[0], [`${argName}2`]: value[1] }];
  } else if (operatorKey === OperationQuery.notbetween) {
    result = [`${field} not between :${argName}1 and :${argName}2`, { [`${argName}1`]: value[0], [`${argName}2`]: value[1] }];
  } else if (operatorKey === OperationQuery.in) {
    result = [`${field} in (:...${argName})`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.notin) {
    result = [`${field} not in (:...${argName})`, { [argName]: value }];
  } else if (operatorKey === "any") {
    result = [`${field} any (:${argName})`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.null) {
    if (value === 'true' || value === true) {
      result = [`${field} is null`];
    } else {
      result = [`${field} is not null`];
    }
  }

  return result;
}