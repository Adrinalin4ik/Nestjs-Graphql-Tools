import { Field, InputType, PartialType, ReturnTypeFunc, TypeMetadataStorage } from "@nestjs/graphql";
import { BaseEntity } from "../common";
import { standardize } from "../utils/functions";
import { FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, FILTER_OPERATION_PREFIX } from "./constants";
import { GraphqlFilterTypeDecoratorMetadata } from "./decorators/field.decorator";

/**
 * Enum defining all available filter operations in the GraphQL schema
 * These operations correspond to SQL comparison operators
 */
export enum OperationQuery {
  eq = 'eq',        // Equal to
  neq = 'neq',      // Not equal to
  gt = 'gt',        // Greater than
  gte = 'gte',      // Greater than or equal to
  lt = 'lt',        // Less than
  lte = 'lte',      // Less than or equal to
  in = 'in',        // In a set of values
  notin = 'notin',  // Not in a set of values
  like = 'like',    // Pattern matching
  notlike = 'notlike', // Not matching pattern
  between = 'between', // Between two values
  notbetween = 'notbetween', // Not between two values
  null = 'null',    // Is null check
}

/**
 * Type defining filter operations for each field of type T
 * @template T - The entity type being filtered
 */
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

/**
 * Type defining a complete filter with AND/OR operations
 * @template T - The entity type being filtered
 */
export type IFilter<T>  = {
  and?: IFilter<T>[];
  or?: IFilter<T>[];
} & IFilterField<T>;

/**
 * Type for raw filter arguments without AND/OR operations
 * @template T - The entity type being filtered
 */
export type RawFilterArgs<T> = IFilter<T> & IFilterField<T>;

// Sets of operations that require special handling
const arrayLikeOperations = new Set([OperationQuery.between, OperationQuery.notbetween, OperationQuery.in, OperationQuery.notin]);
const stringLikeOperations = new Set([OperationQuery.like, OperationQuery.notlike]);

/**
 * Prefixes used for generating input type names
 */
export enum InputMapPrefixes {
  PropertyFilterInputType = 'PropertyFilterInputType',
  FilterInputType = 'FilterInputType',
}

/**
 * Interface defining a filter field with its GraphQL type
 */
export interface FilterFieldDefinition {
  /** Filter name as it appears in the GraphQL playground */
  name: string;
  /** Function returning the GraphQL type (e.g., Int, String, Boolean) */
  typeFn: ReturnTypeFunc;
}

/**
 * Enum defining how object types should be resolved
 */
export enum EObjectResolveType {
  Full,
  Enum
}

// Caches for generated types
const filterFullTypes = new Map();
const filterTypes = new Map();
const propertyTypes = new Map();

/**
 * Generates a filter property type based on the provided field definition
 * This function creates a GraphQL input type for a single property with all available filter operations
 * 
 * @param {FilterFieldDefinition} field - The field definition to generate the type for
 * @returns {BaseEntity} The generated filter property type
 */
const generateFilterPropertyType = (field: FilterFieldDefinition) => {
  // Determine the type name and resolution strategy
  let typeName = field.typeFn && field.typeFn()?.name;
  let objectResolveType = EObjectResolveType.Full;

  // Handle enum types
  if (field.typeFn && !typeName) {
    const enumMeta = TypeMetadataStorage.getEnumsMetadata().find(x => x.ref === field.typeFn());
    typeName = enumMeta.name;
    objectResolveType = EObjectResolveType.Enum
  }

  // Generate unique key for the property type
  const key = `${standardize(typeName)}_${InputMapPrefixes.PropertyFilterInputType}`;

  // Return cached type if it exists
  const propType = propertyTypes.get(key);
  if (propType) return propType;

  // Create new property filter type
  class PropertyFilter {}
  InputType(key, {isAbstract: true})(PropertyFilter);

  // Determine available operations based on type
  const availableOperations = Object.keys(OperationQuery).filter((operation: OperationQuery) => {
    if (objectResolveType === EObjectResolveType.Enum) {
      // Enums only support specific operations
      return [
        OperationQuery.eq, 
        OperationQuery.neq, 
        OperationQuery.in, 
        OperationQuery.notin, 
        OperationQuery.null
      ].includes(operation)
    } else {
      return true
    }
  })

  // Add fields for each operation
  availableOperations.forEach(operationName => {
    field.typeFn(); // Ensure type is compiled
    Field(() => {
      if (arrayLikeOperations.has(OperationQuery[operationName])) {
        return [field.typeFn()];  // Array type for operations like 'in'
      } if ([OperationQuery.null].includes(OperationQuery[operationName])) {
        return Boolean;  // Boolean for null checks
      } else if (stringLikeOperations.has(OperationQuery[operationName])) {
        return String;  // String for pattern matching
      } else {
        return field.typeFn();  // Original type for other operations
      }
    }, {...(field as any).options, nullable: true})(
      PropertyFilter.prototype, 
      FILTER_OPERATION_PREFIX ? `${FILTER_OPERATION_PREFIX}${operationName}` : operationName
    );
  })

  // Set the type name
  Object.defineProperty(PropertyFilter, 'name', {
    value: key,
  });

  // Cache and return the type
  propertyTypes.set(key, PropertyFilter);
  return PropertyFilter;
}

/**
 * Generates a complete filter input type for a set of classes
 * This function creates a GraphQL input type that includes all filterable fields
 * from the provided classes, including inherited fields
 * 
 * @template T - The base entity type
 * @param {T[]} classes - Array of classes to generate filters for
 * @param {string} name - Base name for the generated type
 * @returns {BaseEntity} The generated filter input type
 */
function generateFilterInputType<T extends BaseEntity>(classes: T[], name: string) {
  const key = `${name}${InputMapPrefixes.FilterInputType}`;
  
  // Return cached type if it exists
  if (filterTypes.get(key)) {
    return filterTypes.get(key);
  }

  // Create new filter input type
  class PartialObjectType {}
  InputType(key, {isAbstract: true})(PartialObjectType);
  
  Object.defineProperty(PartialObjectType, 'name', {
    value: key,
  });

  filterTypes.set(key, PartialObjectType);

  const properties: FilterFieldDefinition[] = [];

  // Process each class
  for (const typeFn of classes) {
    // Get custom filter fields
    const customFilterData: GraphqlFilterTypeDecoratorMetadata = Reflect.getMetadata(
      FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, 
      typeFn.prototype
    );
    
    if (customFilterData && customFilterData.fields.size > 0) {
      properties.push(
        ...Array.from(customFilterData.fields.values())
          .filter(x => !customFilterData?.excludedFilterFields.has(x.name))
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
      if (customFilterData) {
        classMetaProps = classMetadata.properties.filter(
          x => !customFilterData?.excludedFilterFields.has(x.name)
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
      const fieldType = generateFilterPropertyType(field);
      Field(() => fieldType, {nullable: true})(PartialObjectType.prototype, field.name)
    } else {
      // Relations are not supported yet. WIP.
      // let referenceInputType = filterTypes.get(`${field.name}${InputMapPrefixes.PropertyFilterType}`);
      // if (!referenceInputType) {
      //   referenceInputType = generateFilterInputType(field.typeFn() as BaseEntity);
      // }
      // Field(() => referenceInputType, {nullable: true})(PartialObjectType.prototype, field.name)
    }
  }

  return PartialObjectType;
}

/**
 * Generates a complete filter input type including AND/OR operations
 * This function creates the final filter input type that can be used in GraphQL queries
 * 
 * @param {BaseEntity[]} classes - Array of classes to generate filters for
 * @param {string} name - Base name for the generated type
 * @returns {BaseEntity} The complete filter input type
 */
export const getFilterFullInputType = (classes: BaseEntity[], name: string) => {
  const key = `${name}_FilterInputType`; 
  const baseKey = `${name}_BaseFilterInputType`; 
  
  // Return cached type if it exists
  if (filterFullTypes.get(key)) {
    return filterFullTypes.get(key);
  }

  // Generate base filter type
  const FilterInputType = generateFilterInputType(classes, name);

  // Create base entity input with AND/OR operations
  @InputType(baseKey)
  class BaseEntityInput extends FilterInputType {
    @Field(() => [BaseEntityInput], {nullable: true})
    and: BaseEntity[];
    @Field(() => [BaseEntityInput], {nullable: true})
    or: BaseEntity[];
  }

  // Create final entity where input
  @InputType(key)
  class EntityWhereInput extends FilterInputType {
    @Field(() => [BaseEntityInput], {nullable: true})
    and: BaseEntity[];
    @Field(() => [BaseEntityInput], {nullable: true})
    or: BaseEntity[];
  }

  // Cache and return the type
  filterFullTypes.set(key, EntityWhereInput);
  return EntityWhereInput;
}