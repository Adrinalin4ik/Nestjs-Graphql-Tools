import { GraphqlSortingFieldMetadata } from "./decorators/field.decorator";
import { ISortingDecoratorParams } from "./decorators/resolver.decorator";

/**
 * Interface defining sorting metadata
 * Used to store additional information about sorting fields
 */
export type ISortingMetadata = {
  _name_: string;
}

/**
 * Type defining sorting arguments for a type T
 * Maps each field to either 'ASC' or 'DESC' sort direction
 * @template T - The entity type being sorted
 */
export type SortArgs<T> = {
  [K in keyof T]: 'ASC' | 'DESC';
};

/**
 * Converts sorting parameters into a format suitable for database queries
 * This function processes sorting parameters and applies any custom field mappings
 * 
 * @param {ISortingMetadata[]} [parameters] - Array of sorting parameters
 * @param {Map<string, GraphqlSortingFieldMetadata>} [customFields] - Custom field mappings
 * @param {ISortingDecoratorParams} [options] - Additional sorting options
 * @returns {ISortingMetadata[] | any} Processed sorting parameters
 */
export const convertSortingParameters = (parameters?: (ISortingMetadata)[], customFields?: Map<string, GraphqlSortingFieldMetadata>, options?: ISortingDecoratorParams) => {
  // Handle non-array input (for testing purposes)
  if (!Array.isArray(parameters)) return parameters;
  
  // Process each sorting parameter
  return parameters && parameters.reduce((accumulatedParams, x) => {
    // Convert each field's sorting parameters
    const convertedParams = Object.entries(x).reduce((acc, [k, v]) => {
      // Handle custom field mappings
      if (customFields.has(k)) {
        const field = customFields.get(k);
        acc[field.sqlExp] = v;
      } else {
        if (options?.sqlAlias) {
          acc[`${options?.sqlAlias}.${k}`] = v
        } else {
          acc[k] = v
        }
      }

      return acc;
    }, {});

    return {
      ...accumulatedParams,
      ...convertedParams
    };
  }, {}) || {};
}