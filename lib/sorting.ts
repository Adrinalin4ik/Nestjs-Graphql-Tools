import { Args, Field, InputType, PartialType, registerEnumType, TypeMetadataStorage } from "@nestjs/graphql";
import { BaseEntity } from "./common";

export const GRAPHQL_SORTING_DECORATOR_METADATA_KEY = 'GraphqlSortingDecorator';
export const SORTING_DECORATOR_NAME_METADATA_KEY = 'SortingPropertyDecorator';
export const SORTING_DECORATOR_OPTIONS_METADATA_KEY = 'SortingPropertyDecoratorOptions';

export enum SortType {
  ASC = 'ASC',
  DESC = 'DESC',
  ASC_NULLS_LAST = 'ASC NULLS LAST',
  ASC_NULLS_FIRST = 'ASC NULLS FIRST',
  DESC_NULLS_LAST = 'DESC NULLS LAST',
  DESC_NULLS_FIRST = 'DESC NULLS FIRST',
}

registerEnumType(SortType, {
  name: 'SortType',
});

export enum SortInputMapPrefixes {
  PropertyFilterType = 'PropertySortType',
  FilterInputType = 'SortInputType',
}

const sortFullTypes = new Map();
const sortTypes = new Map();


function generateSortInputType<T extends BaseEntity>(classRef: T) {
  const key = `${classRef.name}${SortInputMapPrefixes.PropertyFilterType}`;
  if (sortTypes.get(key)) {
    return sortTypes.get(key);
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

  sortTypes.set(key, PartialObjectType);

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
      Field(() => SortType, { nullable: true })(PartialObjectType.prototype, field.name)
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


export type ISortingMetadata = {
  _name_: string;
}

export type SortArgs<T> = {
  [K in keyof T]: 'ASC' | 'DESC';
};

const getSortFullInputType = (classRef: BaseEntity) => {
  const key = `sort${classRef.name}Input`;
  if (sortFullTypes.get(key)) {
    return sortFullTypes.get(key);
  }
  const FilterInputType = generateSortInputType(classRef);
  @InputType(key)
  class EntityWhereInput extends FilterInputType {
    @Field({defaultValue: SORTING_DECORATOR_NAME_METADATA_KEY})
    _name_: string;
  }
  sortFullTypes.set(key, EntityWhereInput);
  return EntityWhereInput;
}

interface IFilterDecoratorParams {
  name?: string;
  sqlAlias?: string;
}

export const Sorting = (baseEntity: () => BaseEntity, options?: IFilterDecoratorParams) => {
  const filterFullType = getSortFullInputType(baseEntity());
  return (target, propertyName, paramIndex) => {
    Reflect.defineMetadata(SORTING_DECORATOR_OPTIONS_METADATA_KEY, options, target, propertyName);
    Args({
      name: options?.name || 'order_by',
      nullable: true,
      defaultValue: {},
      type: () => [filterFullType],
    })(target, propertyName, paramIndex);
  }
}

export const GraphqlSorting = () => {
  return (target, property, descriptor) => {
    const actualDescriptor = descriptor.value;
    descriptor.value = function(...args) {
      applySortingParameter(args, target, property);
      return actualDescriptor.call(this, ...args);
    };
    Reflect.defineMetadata(GRAPHQL_SORTING_DECORATOR_METADATA_KEY, '', target, property);
  };
};

export const applySortingParameter = (args: any[], target, property: string) => {
  const sortArgIndex = args.findIndex(x => Array.isArray(x) && x?.some(x => x._name_ === SORTING_DECORATOR_NAME_METADATA_KEY));
  if (sortArgIndex != -1) {
    const options: IFilterDecoratorParams = Reflect.getMetadata(SORTING_DECORATOR_OPTIONS_METADATA_KEY, target, property) as IFilterDecoratorParams;
    args[sortArgIndex] = convertParameters(args[sortArgIndex], options?.sqlAlias);
  }
}

const convertParameters = <T>(parameters: (SortArgs<T> & ISortingMetadata)[], alias?: string) => {
  return parameters.reduce((accumulatedParams, x) => {
    delete x._name_;
    
    const convertedParams = Object.entries(x).reduce((acc, [k, v]) => {
      if (alias) {
        acc[`${alias}.${k}`] = v
      } else {
        acc[k] = v
      }

      return acc;
    }, {});

    return {
      ...accumulatedParams,
      ...convertedParams
    };
  }, {})
}