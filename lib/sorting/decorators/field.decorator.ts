import { SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY } from "../constants";

/**
 * Options for configuring sorting field behavior
 * Allows customization of how fields are sorted in SQL queries
 */
export interface SortingFieldOptions {
  /** 
   * Custom SQL expression for the left side of the sorting condition
   * This allows for complex sorting expressions beyond simple column names
   * 
   * @example
   * ```sql
   * -- For simple column sorting
   * sqlExp: 't.title'
   * 
   * -- For complex expressions
   * sqlExp: 'concat(u.fname, ' ', u.lname)'
   * ```
   */
  sqlExp?: string;
}

/**
 * Options for excluding fields from sorting
 * Used to prevent certain fields from being sortable
 */
export interface SortingFieldExcludeOptions {
  /** Whether to exclude the field from sorting operations */
  exclude: boolean;
}

/**
 * Interface defining the structure of sorting type metadata
 * Contains information about all sortable fields in a type
 */
export interface GraphqlSortingTypeDecoratorMetadata {
  /** Map of field names to their sorting metadata */
  fields: Map<string, GraphqlSortingFieldMetadata>;
}

/**
 * Interface defining metadata for a single sortable field
 * Extends SortingFieldOptions to include the field name
 */
export interface GraphqlSortingFieldMetadata extends SortingFieldOptions {
  /** Name of the field as it appears in the GraphQL schema */
  name: string;
}

/**
 * Class for managing sorting type metadata
 * Handles the storage and retrieval of sorting configuration for types
 */
export class GraphqlSortingTypeDecoratorMetadata {
  /** Map of field names to their sorting metadata */
  fields: Map<string, GraphqlSortingFieldMetadata> = new Map()
  /** Set of field names that should be excluded from sorting */
  excludedSortingFields = new Set<string>();

  /**
   * Creates a new instance of sorting type metadata
   * @param target - The target class or prototype
   */
  constructor(private target) {
    // Load existing metadata if it exists
    const meta: GraphqlSortingTypeDecoratorMetadata = Reflect.getMetadata(
      SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, 
      target
    );

    if (meta) {
      this.fields = meta.fields;
      this.excludedSortingFields = meta.excludedSortingFields;
    }
  }
  
  /**
   * Saves the current metadata to the target
   */
  save() {
    Reflect.defineMetadata(SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, this, this.target)
  }
}

/**
 * Decorator for marking fields as sortable in GraphQL queries
 * This decorator can be used to:
 * 1. Configure custom SQL expressions for sorting
 * 2. Exclude fields from sorting operations
 * 
 * @param {SortingFieldOptions | SortingFieldExcludeOptions} [options={}] - Configuration options
 * @returns {PropertyDecorator} A property decorator that configures sorting behavior
 * 
 * @example
 * ```typescript
 * class User {
 *   @SortingField({ sqlExp: 'concat(fname, ' ', lname)' })
 *   fullName: string;
 * 
 *   @SortingField({ exclude: true })
 *   password: string;
 * }
 * ```
 */
export const SortingField = (options: SortingFieldOptions | SortingFieldExcludeOptions = {}) => {
  return (target, property) => {
    const metadataObject = new GraphqlSortingTypeDecoratorMetadata(target);

    // Handle field exclusion
    if (options.hasOwnProperty('exclude')) {
      options = options as SortingFieldExcludeOptions;
      metadataObject.excludedSortingFields.add(property);
    } else {
      // Handle custom SQL expressions
      options = options as SortingFieldOptions;
      if (options && !options.sqlExp) {
        options.sqlExp = property;
      }
  
      // Update or create field metadata
      if (metadataObject.fields.has(property)) {
        const field = metadataObject.fields.get(property);
        metadataObject.fields.set(property, {
          ...field,
          ...options
        })
      } else {
        metadataObject.fields.set(property, {
          name: property,
          ...options
        })
      }
    }
    
    metadataObject.save();
  }
}