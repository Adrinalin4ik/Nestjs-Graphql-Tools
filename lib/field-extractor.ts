import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FragmentDefinitionNode, SelectionNode } from 'graphql';

/**
 * Metadata key used for storing GraphQL field information in decorators
 */
export const GraphqlFieldMetadataKey = 'graphql:fieldsData';

/**
 * Parameters for the SelectedFields decorator
 * @interface SelectedFieldsDecoratorParams
 * @property {string} [sqlAlias] - Optional SQL alias for the field, used in database queries
 */
export interface SelectedFieldsDecoratorParams {
  sqlAlias?: string;
}

/**
 * Result structure for selected fields extraction
 * @interface SelectedFieldsResult
 * @property {ExecutionContext} ctx - The execution context containing request information
 * @property {Object} fieldsData - Contains the extracted field information
 * @property {Set<string>} fieldsData.rowFieldsData - Set of selected field names from the GraphQL query
 * @property {string[]} fieldsData.fieldsString - Array of field names as strings, optionally prefixed with SQL alias
 */
export interface SelectedFieldsResult {
  ctx: ExecutionContext;
  fieldsData: {
    rowFieldsData: Set<string>;
    fieldsString: string[];
  };
}

/**
 * Decorator for extracting selected fields from GraphQL queries
 * This decorator is used to automatically extract the fields requested in a GraphQL query
 * and make them available in the resolver method.
 * 
 * @param {SelectedFieldsDecoratorParams} data - Configuration parameters including optional SQL alias
 * @param {ExecutionContext} ctx - The execution context containing the GraphQL request info
 * @returns {SelectedFieldsResult} Object containing the extracted field information
 * 
 * @example
 * ```typescript
 * @Query(() => [User])
 * async getUsers(@SelectedFields() fields: SelectedFieldsResult) {
 *   // fields.fieldsData contains the requested fields
 * }
 * ```
 */
export const SelectedFields = createParamDecorator(
  (data: SelectedFieldsDecoratorParams, ctx: ExecutionContext) => {
    const args = ctx.getArgs();
    const info = args[3];

    const returnObj = {
      ctx,
    };

    // To avoid multiple calls when using dataloader define getter field to be able to compute only once inside the loader function
    Object.defineProperty(returnObj, 'fieldsData', {
      get: () => {
        const rowFieldsData = extractFieldsData(
          info.fieldNodes,
          info.fieldName,
          info.fragments
        );

        const fieldsString = Array.from(rowFieldsData.values()).map((fieldName) => {
          if (data?.sqlAlias) {
            return `${data.sqlAlias}.${fieldName}`;
          } else {
            return fieldName;
          }
        });

        return {
          rowFieldsData,
          fieldsString,
        };
      },
    });

    return returnObj;
  }
);

/**
 * Extracts field data from GraphQL selection nodes
 * This function recursively traverses the GraphQL query AST to extract all requested fields,
 * including those from fragments and nested selections.
 * 
 * @param {ReadonlyArray<SelectionNode>} resolvers - Array of GraphQL selection nodes from the query
 * @param {string} field - The current field name being processed
 * @param {{ [key: string]: FragmentDefinitionNode }} fragments - Map of fragment definitions from the query
 * @param {boolean} [from_fragment=false] - Whether the extraction is from a fragment definition
 * @returns {Set<string>} Set of extracted field names
 */
export function extractFieldsData(
  resolvers: ReadonlyArray<SelectionNode>,
  field: string,
  fragments: { [key: string]: FragmentDefinitionNode },
  from_fragment = false
): Set<string> {
  let results = new Set([]);

  if (from_fragment) {
    for (const resolver of resolvers) {
      if (resolver.kind === 'Field' && resolver?.name.value === '__typename') {
        continue;
      }
      if (resolver.kind === 'Field' && !resolver.selectionSet) {
        results.add(resolver.name.value);
      } else if (resolver.kind === 'FragmentSpread') {
        const fragment = fragments[resolver.name.value];

        if (fragment?.selectionSet) {
          results = new Set([
            ...results,
            ...extractFieldsData(
              fragment.selectionSet.selections,
              field,
              fragments,
              true
            ),
          ]);
        }
      }
    }

    return results;
  }

  for (const resolver of resolvers) {
    if (resolver.kind === 'Field' && resolver.selectionSet) {
      const unifiedName = resolver.name.value;
      if (unifiedName === field) {
        resolver.selectionSet.selections.forEach((item) => {
          if (item.kind === 'Field' && item?.name.value === '__typename') {
            return;
          }
          if (item.kind === 'Field' && !item.selectionSet) {
            results.add(item.name.value);
          } else if (item.kind === 'FragmentSpread') {
            const fragment = fragments[item.name.value];

            if (fragment?.selectionSet) {
              results = new Set([
                ...results,
                ...extractFieldsData(
                  fragment.selectionSet.selections,
                  field,
                  fragments,
                  true
                ),
              ]);
            }
          } else if (item.kind === 'InlineFragment' && item.selectionSet) {
            results = new Set([
              ...results,
              ...extractFieldsData(item.selectionSet.selections, field, fragments, true),
            ]);
          }
        });

        return results;
      } else {
        return extractFieldsData(
          resolver.selectionSet.selections,
          field,
          fragments,
          false
        );
      }
    }
  }

  return results;
}
