import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FragmentDefinitionNode, SelectionNode } from 'graphql';
import { BaseEntity } from './common';
import { extractFieldsData } from './field-extractor';

/**
 * Parameters for configuring the SelectedUnionTypes decorator
 * Allows customization of how union types are extracted from GraphQL queries
 */
interface SelectedFieldsDecoratorParams {
  /** SQL alias to prepend to field names */
  sqlAlias?: string;
  /** Name of the nested polymorphic resolver to extract fields from */
  nestedPolymorphicResolverName?: string;
}

/**
 * Result object containing information about selected union types in a GraphQL query
 * Provides methods to check for and retrieve fields of specific union types
 */
export interface SelectedUnionTypesResult {
  /** Checks if a specific entity type is present in the selection */
  has: (key) => boolean;
  /** Gets the selected fields for a specific entity type */
  getFields: (key) => string[];
  /** Map of entity types to their selected fields */
  types: Map<any, any[]>
}

/**
 * Decorator for extracting selected union types from GraphQL queries
 * This decorator can be used to:
 * 1. Extract which concrete types are selected in a union type field
 * 2. Get the specific fields selected for each concrete type
 * 3. Apply SQL aliases to field names if needed
 * 
 * @example
 * ```typescript
 * @Resolver()
 * class ContentResolver {
 *   @Query()
 *   async contents(
 *     @SelectedUnionTypes({ sqlAlias: 'c' }) selectedTypes: SelectedUnionTypesResult
 *   ) {
 *     if (selectedTypes.has(Article)) {
 *       const articleFields = selectedTypes.getFields(Article);
 *       // articleFields will contain selected fields for Article type
 *     }
 *   }
 * }
 * ```
 */
export const SelectedUnionTypes = createParamDecorator(
  (data: SelectedFieldsDecoratorParams, ctx: ExecutionContext) => {
    const args = ctx.getArgs();
    const info = args[3];

    return getSelectedUnionTypes(info, data);
  }
);

/**
 * Extracts selected union types from a GraphQL query info object
 * 
 * @param info - GraphQL query info object containing selection information
 * @param options - Configuration options for field extraction
 * @returns SelectedUnionTypesResult containing information about selected types
 */
export function getSelectedUnionTypes(info, options?: SelectedFieldsDecoratorParams) {
  const returnObj: SelectedUnionTypesResult = {
    /**
     * Checks if a specific entity type is present in the selection
     * @param entity - Entity class or type name to check
     * @returns boolean indicating if the type is present
     */
    has(entity: BaseEntity | string) {
      if (typeof entity === 'string') {
        return this['types'].has(entity);
      } else {
        return this['types'].has((entity as BaseEntity).name);
      }
    },
    /**
     * Gets the selected fields for a specific entity type
     * @param entity - Entity class or type name to get fields for
     * @returns Array of selected field names, optionally prefixed with SQL alias
     */
    getFields(entity: BaseEntity | string) {
      let fields = [];
      if (typeof entity === 'string') {
        fields = this['types'].get(entity);
      } else {
        fields = this['types'].get((entity as BaseEntity).name);
      }

      return fields.map(field => options?.sqlAlias ? `${options?.sqlAlias}.${field}` : field)
    },
    types: null
  };

  // To avoid multiple calls when using dataloader, defineing the getter field to be able to compute only once inside the loader function
  Object.defineProperty(returnObj, 'types', {
    get: () => {
      const rowFieldsData = extractUnionsData(
        info.fieldNodes,
        options?.nestedPolymorphicResolverName || info.fieldName,
        info.fragments
      );

      return rowFieldsData;
    },
  });

  return returnObj;
}

/**
 * Extracts union type data from GraphQL selection nodes
 * Processes the selection tree to identify which concrete types are selected
 * and what fields are requested for each type
 * 
 * @param resolvers - Array of GraphQL selection nodes
 * @param field - Name of the field containing union types
 * @param fragments - Map of fragment definitions
 * @returns Map of type names to their selected fields
 */
export function extractUnionsData(
  resolvers: ReadonlyArray<SelectionNode>,
  field: string,
  fragments: { [key: string]: FragmentDefinitionNode },
) {
  let results = new Map([]);

  /**
   * Recursively processes selection nodes to extract union type data
   * @param resolvers - Current level of selection nodes
   * @param field - Target field name
   * @param fragments - Available fragment definitions
   */
  function process(
    resolvers: ReadonlyArray<SelectionNode>,
    field: string,
    fragments: { [key: string]: FragmentDefinitionNode },
  ) {
    for (const resolver of resolvers) {
      if (resolver.kind === 'Field' && resolver.selectionSet) {
        const unifiedName = resolver.name.value;
        if (unifiedName === field) {
          resolver.selectionSet.selections.forEach((item) => {
            if (item.kind === 'Field') {
              return;
            } else if (item.kind === 'FragmentSpread') {
              const fragment = fragments[item.name.value];
              
              if (fragment?.selectionSet) {
                process(
                  fragment.selectionSet.selections,
                  field,
                  fragments,
                )
              }
            } else if (item.kind === 'InlineFragment') {
              const data = extractFieldsData(
                item.selectionSet.selections,
                item.typeCondition.name.value,
                fragments,
                true
              );

              results.set(item.typeCondition.name.value, [...data]);
            }
          });
  
          return results;
        } else {
          return process(
            resolver.selectionSet.selections,
            field,
            fragments,
          );
        }
      }
    }
    return results;
  }

  process(resolvers, field, fragments);

  return results;
}
