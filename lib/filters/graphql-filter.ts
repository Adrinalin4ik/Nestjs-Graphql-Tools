import { Any, Between, Brackets, Equal, In, IsNull, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not } from "typeorm";
import { FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, FILTER_DECORATOR_NAME_METADATA_KEY, FILTER_OPERATION_PREFIX, GRAPHQL_FILTER_DECORATOR_METADATA_KEY } from "./constants";
import { CustomFilterFieldDefinition, IFilter, OperationQuery } from "./filter";
import { convertArrayOfStringIntoStringNumber } from "./utils";


export const GraphqlFilter = () => {
  return (target, property, descriptor) => {
    const actualDescriptor = descriptor.value;
    descriptor.value = function(...args) {
      applyFilterParameter(args, target, property);
      return actualDescriptor.call(this, ...args);
    };
    Reflect.defineMetadata(GRAPHQL_FILTER_DECORATOR_METADATA_KEY, '', target, property); // for graphql loader
  };
};

export const applyFilterParameter = (args: any[], target, property: string) => {
  const filterArgIndex = args.findIndex(x => x?._name_ === FILTER_DECORATOR_NAME_METADATA_KEY);
  if (filterArgIndex != -1) {
    const customFields = Reflect.getMetadata(FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target, property) as CustomFilterFieldDefinition[];
    args[filterArgIndex] = convertParameters(args[filterArgIndex], customFields);
  }
}

const convertParameters = <T>(parameters: IFilter<T>, customFields?: CustomFilterFieldDefinition[]) => {
  const obj = new Brackets((qb) => {
    const clonnedParams = {...parameters};
    const extendedParams = customFields.reduce((acc, x) => {
      acc[x.name] = x;
      return acc;
    }, {});
    
    delete clonnedParams.and;
    delete clonnedParams.or;
    delete clonnedParams._name_;
    if (parameters?.and) {
      qb.andWhere(
        new Brackets((andBracketsQb) => {
          for (const op of parameters?.and) {
            const andParameters = recursivelyTransformComparators(op, extendedParams);
            if (andParameters?.typeormWhereQuery || andParameters?.customWhereQuery) {
              if (Object.keys(andParameters?.typeormWhereQuery).length) {
                andBracketsQb.andWhere(andParameters.typeormWhereQuery)
              }
              if (Object.keys(andParameters?.customWhereQuery).length) {
                for (const query of andParameters.customWhereQuery) {
                  andBracketsQb.andWhere(query[0], query[1]);
                }
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
            const orParameters = recursivelyTransformComparators(op, extendedParams);
            if (orParameters?.typeormWhereQuery || orParameters?.customWhereQuery) {
              if (Object.keys(orParameters?.typeormWhereQuery).length) {
                orBracketsQb.orWhere(orParameters.typeormWhereQuery)
              }
              if (Object.keys(orParameters?.customWhereQuery).length) {
                for (const query of orParameters.customWhereQuery) {
                  orBracketsQb.orWhere(query[0], query[1]);
                }
              }
            }
          }
        })
      )
    }
    const basicParameters = recursivelyTransformComparators(clonnedParams, extendedParams);
    if (basicParameters?.typeormWhereQuery || basicParameters?.customWhereQuery) {
      qb.andWhere(
        new Brackets((basicParametersQb) => {
          if (Object.keys(basicParameters?.typeormWhereQuery).length) {
            basicParametersQb.andWhere(basicParameters.typeormWhereQuery)
          }
          if (Object.keys(basicParameters?.customWhereQuery).length) {
            for (const query of basicParameters.customWhereQuery) {
              basicParametersQb.andWhere(query[0], query[1]);
            }
          }
        })
      )
    }
  });
  
  return obj;
}

const recursivelyTransformComparators = (object: Record<string, any>, extendedParams?: {[name: string]: CustomFilterFieldDefinition}) => {
  if (!object || !Object.entries(object).length) return null;
  const typeormWhereQuery = {};
  const customWhereQuery = [];
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
        if (extendedParams?.[key]) {
          const rightExpression = extendedParams[key].sqlExp;
          const argName = `arg_${convertArrayOfStringIntoStringNumber([rightExpression])}`
          if (operatorKey === OperationQuery.eq) {
            customWhereQuery.push([`${rightExpression} = :${argName}`, { [argName]: innerValue }]);
          } else if (operatorKey === OperationQuery.neq) {
            customWhereQuery.push([`${rightExpression} != :${argName}`, { [argName]: innerValue }]);
          } else if (operatorKey === OperationQuery.lt) {
            customWhereQuery.push([`${rightExpression} < :${argName}`, { [argName]: innerValue }]);
          } else if (operatorKey === OperationQuery.lte) {
            customWhereQuery.push([`${rightExpression} <= :${argName}`, { [argName]: innerValue }]);
          } else if (operatorKey === OperationQuery.gt) {
            customWhereQuery.push([`${rightExpression} > :${argName}`, { [argName]: innerValue }]);
          } else if (operatorKey === OperationQuery.gte) {
            customWhereQuery.push([`${rightExpression} >= :${argName}`, { [argName]: innerValue }]);
          } else if (operatorKey === OperationQuery.like) {
            customWhereQuery.push([`${rightExpression} ilike :${argName}`, { [argName]: innerValue }]);
          } else if (operatorKey === OperationQuery.notlike) {
            customWhereQuery.push([`${rightExpression} not ilike :${argName}`, { [argName]: innerValue }]);
          } else if (operatorKey === OperationQuery.between) {
            customWhereQuery.push([`${rightExpression} between :${argName}1 and :${argName}2`, { [`${argName}1`]: innerValue[0], [`${argName}2`]: innerValue[1] }]);
          } else if (operatorKey === OperationQuery.notbetween) {
            customWhereQuery.push([`${rightExpression} not between :${argName}1 and :${argName}2`, { [`${argName}1`]: innerValue[0], [`${argName}2`]: innerValue[1] }]);
          } else if (operatorKey === OperationQuery.in) {
            customWhereQuery.push([`${rightExpression} in (:...${argName})`, { [argName]: innerValue }]);
          } else if (operatorKey === OperationQuery.notin) {
            customWhereQuery.push([`${rightExpression} not in (:...${argName})`, { [argName]: innerValue }]);
          } else if (operatorKey === "any") {
            customWhereQuery.push([`${rightExpression} any (:${argName})`, { [argName]: innerValue }]);
          } else if (operatorKey === OperationQuery.null) {
            if (innerValue === 'true') {
              customWhereQuery.push([`${rightExpression} is null`]);
            } else {
              customWhereQuery.push([`${rightExpression} is not null`]);
            }
          }
        } else {
          if (operatorKey === OperationQuery.eq) {
            typeormWhereQuery[key] = Equal(innerValue);
          } else if (operatorKey === OperationQuery.neq) {
            typeormWhereQuery[key] = Not(innerValue);
          } else if (operatorKey === OperationQuery.lt) {
            typeormWhereQuery[key] = LessThan(innerValue);
          } else if (operatorKey === OperationQuery.lte) {
            typeormWhereQuery[key] = LessThanOrEqual(innerValue);
          } else if (operatorKey === OperationQuery.gt) {
            typeormWhereQuery[key] = MoreThan(innerValue);
          } else if (operatorKey === OperationQuery.gte) {
            typeormWhereQuery[key] = MoreThanOrEqual(innerValue);
          } else if (operatorKey === OperationQuery.like) {
            typeormWhereQuery[key] = Like(innerValue);
          } else if (operatorKey === OperationQuery.notlike) {
            typeormWhereQuery[key] = Not(Like(innerValue));
          } else if (operatorKey === OperationQuery.between) {
            typeormWhereQuery[key] = Between(innerValue[0], innerValue[1]);
          } else if (operatorKey === OperationQuery.notbetween) {
            typeormWhereQuery[key] = Not(Between(innerValue[0], innerValue[1]));
          } else if (operatorKey === OperationQuery.in) {
            typeormWhereQuery[key] = In(innerValue);
          } else if (operatorKey === OperationQuery.notin) {
            typeormWhereQuery[key] = Not(In(innerValue));
          } else if (operatorKey === "any") {
            typeormWhereQuery[key] = Any(innerValue);
          } else if (operatorKey === OperationQuery.null) {
            if (innerValue === 'true') {
              typeormWhereQuery[key] = IsNull();
            } else {
              typeormWhereQuery[key] = Not(IsNull());
            }
          }
        }
      }
    }
  }
  return { typeormWhereQuery, customWhereQuery };
}