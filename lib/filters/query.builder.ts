import { Brackets } from "typeorm";
import { FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, FILTER_DECORATOR_NAME_METADATA_KEY, FILTER_DECORATOR_OPTIONS_METADATA_KEY, FILTER_OPERATION_PREFIX } from "./constants";
import { GraphqlFilterFieldMetadata } from "./decorators/field.decorator";
import { IFilterDecoratorParams } from "./decorators/resolver.decorator";
import { IFilter, OperationQuery } from "./input-type-generator";
import { convertArrayOfStringIntoStringNumber } from "./utils";

export const applyFilterParameter = (args: any[], target, property: string) => {
  const filterArgIndex = args.findIndex(x => x?._name_ === FILTER_DECORATOR_NAME_METADATA_KEY);
  if (filterArgIndex != -1) {
    const options = Reflect.getMetadata(FILTER_DECORATOR_OPTIONS_METADATA_KEY, target, property) as IFilterDecoratorParams;
    const customFields = Reflect.getMetadata(FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target, property) as Map<string, GraphqlFilterFieldMetadata>;
    args[filterArgIndex] = convertParameters(args[filterArgIndex], customFields, options);
  }
}

const convertParameters = <T>(parameters: IFilter<T>, customFields?: Map<string, GraphqlFilterFieldMetadata>, options?: IFilterDecoratorParams) => {
  const obj = new Brackets((qb) => {
    const clonnedParams = {...parameters};
    
    delete clonnedParams.and;
    delete clonnedParams.or;
    delete clonnedParams._name_;
    if (parameters?.and) {
      qb.andWhere(
        new Brackets((andBracketsQb) => {
          for (const op of parameters?.and) {
            const andParameters = recursivelyTransformComparators(op, customFields, options?.sqlAlias);
            if (andParameters?.length) {
              for (const query of andParameters) {
                andBracketsQb.andWhere(query[0], query[1]);
              }
            }
          }
        })
      )
    }
    if (parameters?.or) {
      qb.orWhere(
        new Brackets((orBracketsQb) => {
          for (const op of parameters?.or) {
            const orParameters = recursivelyTransformComparators(op, customFields, options?.sqlAlias);
            if (orParameters?.length) {
              for (const query of orParameters) {
                orBracketsQb.orWhere(query[0], query[1]);
              }
            }
          }
        })
      )
    }
    const basicParameters = recursivelyTransformComparators(clonnedParams, customFields, options?.sqlAlias);
    if (basicParameters) {
      qb.andWhere(
        new Brackets((basicParametersQb) => {
          for (const query of basicParameters) {
            basicParametersQb.andWhere(query[0], query[1]);
          }
        })
      )
    }
  });
  
  return obj;
}

const recursivelyTransformComparators = (object: Record<string, any>, extendedParams?: Map<string, GraphqlFilterFieldMetadata>, sqlAlias?: string) => {
  if (!object || !Object.entries(object).length) return null;
  const typeormWhereQuery = [];
  for (const [key, value] of Object.entries(object)) {
    if (typeof value === "object") {
      const operators = Object.entries(
        value as Record<string, any>
      );
      if (operators.length > 1) {
        throw new Error('Inside filter statement should be only one condition operator for each attribute');
      }
      for (const [innerKey, innerValue] of operators) {
        const operatorKey = innerKey.replace(FILTER_OPERATION_PREFIX, '');
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

const buildSqlArgument = (operatorKey: string, field: string, value: any) => {
  let result = [];
  const argName = `arg_${convertArrayOfStringIntoStringNumber([field])}`
  if (operatorKey === OperationQuery.eq) {
    result = [`${field} = :${argName}`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.neq) {
    result = [`${field} != :${argName}`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.lt) {
    result = [`${field} < :${argName}`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.lte) {
    result = [`${field} <= :${argName}`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.gt) {
    result = [`${field} > :${argName}`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.gte) {
    result = [`${field} >= :${argName}`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.like) {
    result = [`${field} ilike :${argName}`, { [argName]: value }];
  } else if (operatorKey === OperationQuery.notlike) {
    result = [`${field} not ilike :${argName}`, { [argName]: value }];
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
    if (value === 'true') {
      result = [`${field} is null`];
    } else {
      result = [`${field} is not null`];
    }
  }

  return result;
}