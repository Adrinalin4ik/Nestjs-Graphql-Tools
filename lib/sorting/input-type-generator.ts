import { Field, InputType, PartialType, registerEnumType, ReturnTypeFunc, TypeMetadataStorage } from "@nestjs/graphql";
import { BaseEntity } from "../common";
import { SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, SORTING_DECORATOR_NAME_METADATA_KEY } from "./constants";
import { GraphqlSortingTypeDecoratorMetadata } from "./decorators/field.decorator";

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
  SortingInputType = 'SortingInputType',
}

export interface SortingFieldDefinition {
  /** Sorting name. This name will be shown in the playground */
  name: string;
  /** Graphql type function. Basic types Int, String, Boolean, GraphQLISODateTime. Example value () => String */
  typeFn?: ReturnTypeFunc;
} 

const sortingFullTypes = new Map();
const sortingTypes = new Map();

function generateSortingInputType<T extends BaseEntity>(classes: T[], name: string) {
  const key = `${name}_${SortInputMapPrefixes.SortingInputType}`;
  if (sortingTypes.get(key)) {
    return sortingTypes.get(key);
  }

  class PartialObjectType {}
  InputType(key, {isAbstract: true})(PartialObjectType);
  
  Object.defineProperty(PartialObjectType, 'name', {
    value: key,
  });

  sortingTypes.set(key, PartialObjectType);

  const properties: SortingFieldDefinition[] = [];

  for (const typeFn of classes) {
    const customSortingData: GraphqlSortingTypeDecoratorMetadata = Reflect.getMetadata(SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, typeFn.prototype)
    if (customSortingData) {
      properties.push(...customSortingData.fields.values());
    }
    const classMetadata = TypeMetadataStorage.getObjectTypeMetadataByTarget(typeFn);
    if (classMetadata) {
      PartialType(typeFn, InputType); // cast to input type
      TypeMetadataStorage.loadClassPluginMetadata([classMetadata]);
      TypeMetadataStorage.compileClassMetadata([classMetadata]);

      const objectTypesMetadata = TypeMetadataStorage.getObjectTypesMetadata();
      const inheritedType = objectTypesMetadata.find(x => x.target.name === typeFn?.__extension__);
      
      if (inheritedType) {
        // Compile inherited type
        TypeMetadataStorage.loadClassPluginMetadata([inheritedType]);
        TypeMetadataStorage.compileClassMetadata([inheritedType]);
      }

      if (!classMetadata?.properties) {
        throw new Error(`DTO ${typeFn.name} hasn't been initialized yet`)
      }
    
    
      properties.push(...(inheritedType?.properties || []), ...classMetadata.properties)
    }
  }

  for (const field of properties) {
    const targetClassMetadata = TypeMetadataStorage.getObjectTypeMetadataByTarget(field.typeFn && field.typeFn() as BaseEntity);
    if (!targetClassMetadata) {
      if (typeof field.typeFn === 'function') {
        field.typeFn();
      }
      Field(() => SortType, { nullable: true })(PartialObjectType.prototype, field.name)
    } else {
      // Relations are not supported yet
      // let referenceInputType = sortingTypes.get(`${field.name}${InputMapPrefixes.PropertySortingType}`);
      // if (!referenceInputType) {
      //   referenceInputType = generateSortingInputType(field.typeFn() as BaseEntity);
      // }
      // Field(() => referenceInputType, {nullable: true})(PartialObjectType.prototype, field.name)
    }
  }

  return PartialObjectType;
}

export const getSortingFullInputType = (classes: BaseEntity[], name: string) => {
  const key = `${name}_SortingInputType`; 
  if (sortingFullTypes.get(key)) {
    return sortingFullTypes.get(key);
  }
  const SortingInputType = generateSortingInputType(classes, name);
  @InputType(key)
  class EntitySortingInput extends SortingInputType {
    @Field({defaultValue: SORTING_DECORATOR_NAME_METADATA_KEY})
    _name_: string;
  }
  sortingFullTypes.set(key, EntitySortingInput);
  return EntitySortingInput;
}
