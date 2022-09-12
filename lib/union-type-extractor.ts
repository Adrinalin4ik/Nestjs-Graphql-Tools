import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FragmentDefinitionNode, SelectionNode } from 'graphql';
import { BaseEntity } from './common';

const GraphqlFieldMetadataKey = 'graphql:fieldsData';

interface SelectedFieldsDecoratorParams {
  sqlAlias?: string;
}

interface SelectedFieldsResult {
  ctx: ExecutionContext;
  fieldsData: {
    rowFieldsData: Set<string>;
    fieldsString: string[];
  };
}

export const SelectedUnionTypes = createParamDecorator(
  (data: SelectedFieldsDecoratorParams, ctx: ExecutionContext) => {
    const args = ctx.getArgs();
    const info = args[3];

    const returnObj = {
      ctx,
      has(entity: BaseEntity | string) {
        if (typeof entity === 'string') {
          return this['typesSet'].has(entity);
        } else {
          return this['typesSet'].has((entity as BaseEntity).name);
        }
      }
    };

    // To avoid multiple calls when using dataloader define getter field to be able to compute only once inside the loader function
    Object.defineProperty(returnObj, 'typesSet', {
      get: () => {
        const rowFieldsData = extractFieldsData(
          info.fieldNodes,
          info.fieldName,
          info.fragments
        );

        return rowFieldsData;
      },
    });

    return returnObj;
  }
);

function extractFieldsData(
  resolvers: ReadonlyArray<SelectionNode>,
  field: string,
  fragments: { [key: string]: FragmentDefinitionNode },
): Set<string> {
  let results = new Set([]);
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
              results = new Set([
                ...results,
                ...extractFieldsData(
                  fragment.selectionSet.selections,
                  field,
                  fragments,
                ),
              ]);
            }
          } else if (item.kind === 'InlineFragment') {
            results.add(item.typeCondition.name.value);

            results = new Set([
              ...results,
              ...extractFieldsData(
                item.selectionSet.selections,
                field,
                fragments,
              )
            ])
          }
        });

        return results;
      } else {
        return extractFieldsData(
          resolver.selectionSet.selections,
          field,
          fragments,
        );
      }
    }
  }

  return results;
}
