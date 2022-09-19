import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FragmentDefinitionNode, SelectionNode } from 'graphql';

export const GraphqlFieldMetadataKey = 'graphql:fieldsData';

export interface SelectedFieldsDecoratorParams {
  sqlAlias?: string;
}

export interface SelectedFieldsResult {
  ctx: ExecutionContext;
  fieldsData: {
    rowFieldsData: Set<string>;
    fieldsString: string[];
  };
}

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
        return;
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
