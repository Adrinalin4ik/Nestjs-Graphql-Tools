import { Args, Field, InputType, PartialType, TypeMetadataStorage } from "@nestjs/graphql";
import { Any, Between, Brackets, Equal, In, IsNull, LessThan, LessThanOrEqual, Like, MoreThan, MoreThanOrEqual, Not } from "typeorm";
import { BaseEntity } from "./common";

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

function generateFilterInputType<T extends BaseEntity>(classRef: T) {
  const key = `${classRef.name}${InputMapPrefixes.PropertyFilterType}`;
  if (filterTypes.get(key)) {
    return filterTypes.get(key);
  }
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

  class PartialObjectType {}
  InputType(key, {isAbstract: true})(PartialObjectType);
  
  const t = TypeMetadataStorage;
  Object.defineProperty(PartialObjectType, 'name', {
    value: key,
  });

  filterTypes.set(key, PartialObjectType);

  if (!classMetadata?.properties) {
    throw new Error(`DTO ${classRef.name} hasn't been initialized yet`)
  }
  
  const properties = [...(inheritedType?.properties || []), ...classMetadata.properties]

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

const getFilterFullInputType = (classRef: BaseEntity) => {
  const key = `where${classRef.name}Input`;
  if (filterFullTypes.get(key)) {
    return filterFullTypes.get(key);
  }
  const FilterInputType = generateFilterInputType(classRef);
  @InputType(key)
  class EntityWhereInput extends FilterInputType {
    @Field({defaultValue: 'FilterPropertyDecorator'})
    _name_: string;
    @Field(() => [FilterInputType], {nullable: true})
    and: BaseEntity[];
    @Field(() => [FilterInputType], {nullable: true})
    or: BaseEntity[];
  }
  filterFullTypes.set(key, EntityWhereInput);
  return EntityWhereInput;
}

interface IFilterDecoratorParams {
  name?: string;
}

export const Filter = (baseEntity: () => BaseEntity, options?: IFilterDecoratorParams) => {
  const filterFullType = getFilterFullInputType(baseEntity());
  return (target, propertyName, paramIndex) => {
    Args({
      name: options?.name || 'where',
      nullable: true,
      defaultValue: {},
      type: () => filterFullType,
    })(target, propertyName, paramIndex);
  }
}

export const GraphqlFilter = () => {
  return (_target, _property, descriptor) => {
    const actualDescriptor = descriptor.value;
    descriptor.value = function(...args) {
      applyFilterParameter(args);
      return actualDescriptor.call(this, ...args);
    };
  };
};

export const applyFilterParameter = (args: any[]) => {
  const filterArgIndex = args.findIndex(x => x?._name_ === 'FilterPropertyDecorator');
  if (filterArgIndex != -1) {
    args[filterArgIndex] = convertParameters(args[filterArgIndex]);
  }
}

const convertParameters = <T>(parameters: IFilter<T>) => {
  const obj = new Brackets((qb) => {
    const clonnedParams = {...parameters};
    delete clonnedParams.and;
    delete clonnedParams.or;
    delete clonnedParams._name_;
    if (parameters?.and) {
      qb.andWhere(
        new Brackets((andBracketsQb) => {
          for (const op of parameters?.and) {
            const andParameters = recursivelyTransformComparators(op);
            if (andParameters) {
              andBracketsQb.andWhere(andParameters)
              // if (andParameters.)
            }
          }
        })
      )
    }
    if (parameters?.or) {
      qb.orWhere(
        new Brackets((orBracketsQb) => {
          for (const op of parameters?.or) {
            const orParameters = recursivelyTransformComparators(op);
            if (orParameters) {
              orBracketsQb.orWhere(orParameters);
            }
          }
        })
      )
    }
    const basicParameters = recursivelyTransformComparators(clonnedParams);

    if (basicParameters) {
      qb.andWhere(
        new Brackets((basicParametersQb) => {
          basicParametersQb.andWhere(basicParameters)
        })
      )
    }
  });
  
  return obj;
}

const recursivelyTransformComparators = (object: Record<string, any>) => {
  if (!object || !Object.entries(object).length) return null;
  const typeormWhereQuery = {};
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
  return typeormWhereQuery;
}