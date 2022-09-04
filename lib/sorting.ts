import { Args, Field, InputType, PartialType, registerEnumType, TypeMetadataStorage } from "@nestjs/graphql";
import { BaseEntity } from "./common";

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
    @Field({defaultValue: 'SortingPropertyDecorator'})
    _name_: string;
  }
  sortFullTypes.set(key, EntityWhereInput);
  return EntityWhereInput;
}

interface IFilterDecoratorParams {
  name?: string;
}

export const Sorting = (baseEntity: () => BaseEntity, options?: IFilterDecoratorParams) => {
  const filterFullType = getSortFullInputType(baseEntity());
  return (target, propertyName, paramIndex) => {
    Args({
      name: options?.name || 'sorting',
      nullable: true,
      defaultValue: {},
      type: () => [filterFullType],
    })(target, propertyName, paramIndex);
  }
}

export const GraphqlSorting = () => {
  return (_target, _property, descriptor) => {
    const actualDescriptor = descriptor.value;
    descriptor.value = function(...args) {
      applySortingParameter(args);
      return actualDescriptor.call(this, ...args);
    };
  };
};

export const applySortingParameter = (args: any[]) => {
  const sortArgIndex = args.findIndex(x => Array.isArray(x) && x?.some(x => x._name_ === 'SortingPropertyDecorator'));
  if (sortArgIndex != -1) {
    args[sortArgIndex] = convertParameters(args[sortArgIndex]);
  }
}

const convertParameters = <T>(parameters: (SortArgs<T> & ISortingMetadata)[]) => {
  return parameters.reduce((acc, x) => {
    delete x._name_;
    return {
      ...acc,
      ...x,
    };
  }, {});
}