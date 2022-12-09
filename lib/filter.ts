import { Args, Field, InputType, PartialType, ReturnTypeFunc, TypeMetadataStorage } from "@nestjs/graphql";
import { Any, Between, Brackets, Equal, In, IsNull, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not } from "typeorm";
import { BaseEntity } from "./common";

export const GRAPHQL_FILTER_DECORATOR_METADATA_KEY = 'GraphqlFilterDecorator';
export const FILTER_DECORATOR_NAME_METADATA_KEY = 'FilterPropertyDecorator';
export const FILTER_DECORATOR_OPTIONS_METADATA_KEY = 'FilterPropertyDecoratorOptions';
const FILTER_OPERATION_PREFIX = process.env.FILTER_OPERATION_PREFIX || undefined;

export enum OperationQuery {
  eq = 'eq',
  neq = 'neq',
  gt = 'gt',
  gte = 'gte',
  lt = 'lt',
  lte = 'lte',
  in = 'in',
  notin = 'notin',
  like = 'like',
  notlike = 'notlike',
  between = 'between',
  notbetween = 'notbetween',
  null = 'null',
}

const arrayLikeOperations = new Set([OperationQuery.between, OperationQuery.notbetween, OperationQuery.in]);

export enum InputMapPrefixes {
  PropertyFilterType = 'PropertyFilterType',
  FilterInputType = 'FilterInputType',
}

export interface FilterFieldDefinition {
  /** Filter name. This name will be shown in the playground */
  name: string;
  /** Graphql type function. Basic types Int, String, Boolean, GraphQLISODateTime. Example value () => String */
  typeFn: ReturnTypeFunc;
} 

export interface CustomFilterFieldDefinition extends FilterFieldDefinition {
  /** Left side of conditional sql expression. 
   * Examples: 
   * 1. Select * from task t where t.title ilike '%test%'. Statement t.title is the left side of a statement 
   * 2. Select * from user u where concat(u.fname, ' ', u.lname) ilike %alex%. Statement concat(u.fname, ' ', u.lname) is the left side of the conditional statement*/
  sqlExp: string;
} 

export interface CustomFilters {
  disableDefaultFilters?: boolean;
  fields: CustomFilterFieldDefinition[];
}

export interface IFilterDecoratorParams {
  name?: string;
  customFilters?: CustomFilters;
}


const filterFullTypes = new Map();
const filterTypes = new Map();
const propertyTypes = new Map()

const generateFilterPropertyType = (field, parentName: string) => {
  const key = `${field.name}${parentName}${InputMapPrefixes.PropertyFilterType}`;

  const propType = propertyTypes.get(key);
  if (propType) return propType;

  class PropertyFilter {}
  InputType(key, {isAbstract: true})(PropertyFilter);

  Object.keys(OperationQuery).forEach(operationName => {
    field.typeFn();
    Field(() => {
      if (arrayLikeOperations.has(OperationQuery[operationName])) {
        return [field.typeFn()];
      } if ([OperationQuery.null].includes(OperationQuery[operationName])) {
        return Boolean;
      } else {
        return field.typeFn();
      }
    }
    , {...field.options, nullable: true})(PropertyFilter.prototype, FILTER_OPERATION_PREFIX ? `${FILTER_OPERATION_PREFIX}${operationName}` : operationName);
  })

  Object.defineProperty(PropertyFilter, 'name', {
    value: key,
  });

  propertyTypes.set(key, PropertyFilter);
  return PropertyFilter;
}

function generateFilterInputType<T extends BaseEntity>(classRef: T, options?: IFilterDecoratorParams) {
  const key = `${classRef.name}${compressFieldsName(options?.customFilters?.fields)}${InputMapPrefixes.PropertyFilterType}`;
  if (filterTypes.get(key)) {
    return filterTypes.get(key);
  }

  class PartialObjectType {}
  InputType(key, {isAbstract: true})(PartialObjectType);
  
  Object.defineProperty(PartialObjectType, 'name', {
    value: key,
  });

  filterTypes.set(key, PartialObjectType);

  const properties: FilterFieldDefinition[] = [];

  if (!options?.customFilters?.disableDefaultFilters) { // extracting DTO fields
    PartialType(classRef, InputType); // cast to input type
    const classMetadata = TypeMetadataStorage.getObjectTypeMetadataByTarget(classRef);
    TypeMetadataStorage.loadClassPluginMetadata([classMetadata]);
    TypeMetadataStorage.compileClassMetadata([classMetadata]);

    const objectTypesMetadata = TypeMetadataStorage.getObjectTypesMetadata();
    const inheritedType = objectTypesMetadata.find(x => x.target.name === classRef?.__extension__);
    
    if (inheritedType) {
      // Compile inherited type
      TypeMetadataStorage.loadClassPluginMetadata([inheritedType]);
      TypeMetadataStorage.compileClassMetadata([inheritedType]);
    }

    if (!classMetadata?.properties) {
      throw new Error(`DTO ${classRef.name} hasn't been initialized yet`)
    }
  
  
    properties.push(...(inheritedType?.properties || []), ...classMetadata.properties)
  }

  if (options?.customFilters?.fields?.length) {
    properties.push(...options.customFilters.fields)
  }

  for (const field of properties) {
    const targetClassMetadata = TypeMetadataStorage.getObjectTypeMetadataByTarget(field.typeFn() as BaseEntity);
    if (!targetClassMetadata) {
      if (typeof field.typeFn === 'function') {
        field.typeFn();
      }
      const fieldType = generateFilterPropertyType(field, classRef.name);
      Field(() => fieldType, {nullable: true})(PartialObjectType.prototype, field.name)
    } else {
      // Relations are not supported yet
      // let referenceInputType = filterTypes.get(`${field.name}${InputMapPrefixes.PropertyFilterType}`);
      // if (!referenceInputType) {
      //   referenceInputType = generateFilterInputType(field.typeFn() as BaseEntity);
      // }
      // Field(() => referenceInputType, {nullable: true})(PartialObjectType.prototype, field.name)
    }
  }

  return PartialObjectType;
}

export type IFilterField<T> = {
  [K in keyof T]: {
    eq: T[K],
    neq: T[K],
    gt: T[K],
    gte: T[K],
    lt: T[K],
    lte: T[K],
    in: T[K],
    like: T[K],
    notlike: T[K],
    between: T[K],
    notbetween: T[K],
    null: T[K],
  };
}

export interface IFilter<T> {
  and: IFilterField<T>[];
  or: IFilterField<T>[];
  _name_: string;
}

const getFilterFullInputType = (classRef: BaseEntity, options?: IFilterDecoratorParams) => {
  const key = `where${classRef.name}${compressFieldsName(options?.customFilters?.fields)}Input`; 
  if (filterFullTypes.get(key)) {
    return filterFullTypes.get(key);
  }
  const FilterInputType = generateFilterInputType(classRef, options);
  @InputType(key)
  class EntityWhereInput extends FilterInputType {
    @Field({defaultValue: FILTER_DECORATOR_NAME_METADATA_KEY, description: 'Don\'t touch this field. Reserved for nestjs-graphql-toos purposes.'})
    _name_: string;
    @Field(() => [FilterInputType], {nullable: true})
    and: BaseEntity[];
    @Field(() => [FilterInputType], {nullable: true})
    or: BaseEntity[];
  }
  filterFullTypes.set(key, EntityWhereInput);
  return EntityWhereInput;
}

export const Filter = (baseEntity: () => BaseEntity, options?: IFilterDecoratorParams) => {
  const filterFullType = getFilterFullInputType(baseEntity(), options);
  return (target, propertyName, paramIndex) => {
    Reflect.defineMetadata(FILTER_DECORATOR_OPTIONS_METADATA_KEY, options, target, propertyName);
    Args({
      name: options?.name || 'where',
      nullable: true,
      defaultValue: {},
      type: () => filterFullType,
    })(target, propertyName, paramIndex);
  }
}

export const GraphqlFilter = () => {
  return (target, property, descriptor) => {
    const actualDescriptor = descriptor.value;
    descriptor.value = function(...args) {
      applyFilterParameter(args, target, property);
      return actualDescriptor.call(this, ...args);
    };
    Reflect.defineMetadata(GRAPHQL_FILTER_DECORATOR_METADATA_KEY, '', target, property);
  };
};

export const applyFilterParameter = (args: any[], target, property: string) => {
  const filterArgIndex = args.findIndex(x => x?._name_ === FILTER_DECORATOR_NAME_METADATA_KEY);
  if (filterArgIndex != -1) {
    const options: IFilterDecoratorParams = Reflect.getMetadata(FILTER_DECORATOR_OPTIONS_METADATA_KEY, target, property) as IFilterDecoratorParams;
    args[filterArgIndex] = convertParameters(args[filterArgIndex], options?.customFilters);
  }
}

const convertParameters = <T>(parameters: IFilter<T>, customFilters?: CustomFilters) => {
  const obj = new Brackets((qb) => {
    const clonnedParams = {...parameters};
    const extendedParams = customFilters.fields.reduce((acc, x) => {
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
            customWhereQuery.push([`${rightExpression} in (...:${argName})`, { [argName]: innerValue }]);
          } else if (operatorKey === OperationQuery.notin) {
            customWhereQuery.push([`${rightExpression} not in (...:${argName})`, { [argName]: innerValue }]);
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

const compressFieldsName = (fields: CustomFilterFieldDefinition[]) => {
  if (!fields?.length) return '';
  
  return convertArrayOfStringIntoStringNumber(fields.map(x => x.name));
}

const convertArrayOfStringIntoStringNumber = (array: string[]) => {
  if (!array.length) return '';

  const sortedArray = array.sort();
  const stringArray = Array.from(sortedArray.join(''));
  const charSum = stringArray.reduce((sum, x) => (sum + x.charCodeAt(0)), 0);

  return `${charSum}${stringArray.length}${sortedArray.length}`;
}