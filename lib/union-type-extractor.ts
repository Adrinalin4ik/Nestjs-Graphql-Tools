import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FragmentDefinitionNode, SelectionNode } from 'graphql';
import { BaseEntity } from './common';
import { extractFieldsData } from './field-extractor';

interface SelectedFieldsDecoratorParams {
  sqlAlias?: string;
  nestedPolymorphicResolverName?: string;
}

export interface SelectedUnionTypesResult {
  has: (key) => boolean;
  getFields: (key) => string[];
  types: Map<any, any[]>
}

export const SelectedUnionTypes = createParamDecorator(
  (data: SelectedFieldsDecoratorParams, ctx: ExecutionContext) => {
    const args = ctx.getArgs();
    const info = args[3];

    return getSelectedUnionTypes(info, data);
  }
);

export function getSelectedUnionTypes(info, options?: SelectedFieldsDecoratorParams) {
  const returnObj: SelectedUnionTypesResult = {
    has(entity: BaseEntity | string) {
      if (typeof entity === 'string') {
        return this['types'].has(entity);
      } else {
        return this['types'].has((entity as BaseEntity).name);
      }
    },
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

  // To avoid multiple calls when using dataloader define getter field to be able to compute only once inside the loader function
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

export function extractUnionsData(
  resolvers: ReadonlyArray<SelectionNode>,
  field: string,
  fragments: { [key: string]: FragmentDefinitionNode },
) {
  let results = new Map([]);

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
                
              process(
                item.selectionSet.selections,
                field,
                fragments,
              )
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
