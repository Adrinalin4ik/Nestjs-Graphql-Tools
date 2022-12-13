import { SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, SORTING_DECORATOR_NAME_METADATA_KEY, SORTING_DECORATOR_OPTIONS_METADATA_KEY } from "./constants";
import { GraphqlSortingFieldMetadata } from "./decorators/field.decorator";
import { ISortingDecoratorParams } from "./decorators/resolver.decorator";

export type ISortingMetadata = {
  _name_: string;
}

export type SortArgs<T> = {
  [K in keyof T]: 'ASC' | 'DESC';
};

export const applySortingParameter = (args: any[], target, property: string) => {
  const sortingArgIndex = args.findIndex(x => Array.isArray(x) && x?.some(x => x._name_ === SORTING_DECORATOR_NAME_METADATA_KEY));
  if (sortingArgIndex != -1) {
    const options = Reflect.getMetadata(SORTING_DECORATOR_OPTIONS_METADATA_KEY, target, property) as ISortingDecoratorParams;
    const customFields = Reflect.getMetadata(SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target, property) as Map<string, GraphqlSortingFieldMetadata>;
    args[sortingArgIndex] = convertParameters(args[sortingArgIndex], customFields, options);
  }
}

const convertParameters = <T>(parameters: (SortArgs<T> & ISortingMetadata)[], customFields?: Map<string, GraphqlSortingFieldMetadata>, options?: ISortingDecoratorParams) => {
  return parameters.reduce((accumulatedParams, x) => {
    delete x._name_;
    
    const convertedParams = Object.entries(x).reduce((acc, [k, v]) => {
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
  }, {})
}