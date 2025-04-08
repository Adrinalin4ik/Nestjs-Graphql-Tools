import { Field, InputType, PartialType, registerEnumType, ReturnTypeFunc, TypeMetadataStorage } from "@nestjs/graphql";
import { BaseEntity } from "../common";
import { SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY } from "./constants";
import { GraphqlSortingTypeDecoratorMetadata } from "./decorators/field.decorator";

/**
 * Enum defining all available sorting directions in the GraphQL schema
 * These correspond to SQL ORDER BY clauses with optional NULLS handling
 */
export enum SortType {
  ASC = 'ASC',
  DESC = 'DESC',
  ASC_NULLS_LAST = 'ASC NULLS LAST',
  ASC_NULLS_FIRST = 'ASC NULLS FIRST',
  DESC_NULLS_LAST = 'DESC NULLS LAST',
  DESC_NULLS_FIRST = 'DESC NULLS FIRST',
}

// Register the SortType enum with GraphQL
registerEnumType(SortType, {
  name: 'SortType',
});

/**
 * Type defining sorting operations for each field of type T
 * @template T - The entity type being sorted
 */
export type ISortingField<T> = {
  [K in keyof T]: SortType;
}

/**
 * Type for raw sorting arguments without additional metadata
 * @template T - The entity type being sorted
 */
export type RawSortingArgs<T> = ISortingField<T>;

/**
 * Prefixes used for generating sorting input type names
 */
export enum SortInputMapPrefixes {
  SortingInputType = 'SortingInputType',
}

/**
 * Interface defining a sorting field with its GraphQL type
 */
export interface SortingFieldDefinition {
  /** Field name as it appears in the GraphQL playground */
  name: string;
  /** Optional function returning the GraphQL type (e.g., Int, String, Boolean) */
  typeFn?: ReturnTypeFunc;
} 

// Cache for generated sorting types
const sortingFullTypes = new Map();
const sortingTypes = new Map();

/**
 * Generates a sorting input type for a set of classes
 * This function creates a GraphQL input type that includes all sortable fields
 * from the provided classes
 * 
 * @template T - The base entity type
 * @param {T[]} classes - Array of classes to generate sorting types for
 * @param {string} name - Base name for the generated type
 * @returns {BaseEntity} The generated sorting input type
 */
function generateSortingInputType<T extends BaseEntity>(classes: T[], name: string) {
  const key = `${name}_${SortInputMapPrefixes.SortingInputType}`;
  if (sortingTypes.get(key)) {
    return sortingTypes.get(key);
  }

  // Create new sorting input type
  class PartialObjectType {}
  InputType(key, {isAbstract: true})(PartialObjectType);
  
  Object.defineProperty(PartialObjectType, 'name', {
    value: key,
  });

  sortingTypes.set(key, PartialObjectType);

  const properties: SortingFieldDefinition[] = [];

  // Process each class
  for (const typeFn of classes) {
    // Get custom sorting fields
    const customSortingData: GraphqlSortingTypeDecoratorMetadata = Reflect.getMetadata(
      SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, 
      typeFn.prototype
    );
    
    if (customSortingData && customSortingData.fields.size > 0) {
      properties.push(
        ...Array.from(customSortingData.fields.values())
          .filter(x => !customSortingData?.excludedSortingFields.has(x.name))
      );
    }

    // Get class metadata
    const classMetadata = TypeMetadataStorage.getObjectTypeMetadataByTarget(typeFn);
    if (classMetadata) {
      // Convert to input type and compile metadata
      PartialType(typeFn, InputType);
      TypeMetadataStorage.loadClassPluginMetadata([classMetadata]);
      TypeMetadataStorage.compileClassMetadata([classMetadata]);

      // Handle inherited types
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
      
      // Filter out excluded fields
      let classMetaProps = classMetadata.properties;
      if (customSortingData) {
        classMetaProps = classMetadata.properties.filter(
          x => !customSortingData?.excludedSortingFields.has(x.name)
        );
      }
      
      // Combine inherited and current class properties
      properties.push(...(inheritedType?.properties || []), ...classMetaProps)
    } else {
      PartialType(typeFn, InputType);
    }
  }

  // Add fields to the input type
  for (const field of properties) {
    const targetClassMetadata = TypeMetadataStorage.getObjectTypeMetadataByTarget(
      field.typeFn && field.typeFn() as BaseEntity
    );
    
    if (!targetClassMetadata) {
      if (typeof field.typeFn === 'function') {
        field.typeFn();
      }
      Field(() => SortType, { nullable: true })(PartialObjectType.prototype, field.name)
    } else {
      // Relations are not supported yet. WIP.
      // let referenceInputType = sortingTypes.get(`${field.name}${InputMapPrefixes.PropertySortingType}`);
      // if (!referenceInputType) {
      //   referenceInputType = generateSortingInputType(field.typeFn() as BaseEntity);
      // }
      // Field(() => referenceInputType, {nullable: true})(PartialObjectType.prototype, field.name)
    }
  }

  return PartialObjectType;
}

/**
 * Generates a complete sorting input type for a set of classes
 * This function creates the final sorting input type that can be used in GraphQL queries
 * 
 * @param {BaseEntity[]} classes - Array of classes to generate sorting types for
 * @param {string} name - Base name for the generated type
 * @returns {BaseEntity} The complete sorting input type
 */
export const getSortingFullInputType = (classes: BaseEntity[], name: string) => {
  const key = `${name}_SortingInputType`; 
  if (sortingFullTypes.get(key)) {
    return sortingFullTypes.get(key);
  }

  // Generate base sorting type
  const SortingInputType = generateSortingInputType(classes, name);

  // Create final entity sorting input
  @InputType(key)
  class EntitySortingInput extends SortingInputType {}

  // Cache and return the type
  sortingTypes.set(key, EntitySortingInput);
  return EntitySortingInput;
}
