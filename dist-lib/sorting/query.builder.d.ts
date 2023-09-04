import { GraphqlSortingFieldMetadata } from "./decorators/field.decorator";
import { ISortingDecoratorParams } from "./decorators/resolver.decorator";
export type ISortingMetadata = {
    _name_: string;
};
export type SortArgs<T> = {
    [K in keyof T]: 'ASC' | 'DESC';
};
export declare const convertSortingParameters: (parameters?: (ISortingMetadata)[], customFields?: Map<string, GraphqlSortingFieldMetadata>, options?: ISortingDecoratorParams) => {};
