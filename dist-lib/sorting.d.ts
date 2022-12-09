import { BaseEntity } from "./common";
export declare const GRAPHQL_SORTING_DECORATOR_METADATA_KEY = "GraphqlSortingDecorator";
export declare const SORTING_DECORATOR_NAME_METADATA_KEY = "SortingPropertyDecorator";
export declare const SORTING_DECORATOR_OPTIONS_METADATA_KEY = "SortingPropertyDecoratorOptions";
export declare enum SortType {
    ASC = "ASC",
    DESC = "DESC",
    ASC_NULLS_LAST = "ASC NULLS LAST",
    ASC_NULLS_FIRST = "ASC NULLS FIRST",
    DESC_NULLS_LAST = "DESC NULLS LAST",
    DESC_NULLS_FIRST = "DESC NULLS FIRST"
}
export declare enum SortInputMapPrefixes {
    PropertyFilterType = "PropertySortType",
    FilterInputType = "SortInputType"
}
export declare type ISortingMetadata = {
    _name_: string;
};
export declare type SortArgs<T> = {
    [K in keyof T]: 'ASC' | 'DESC';
};
interface IFilterDecoratorParams {
    name?: string;
    sqlAlias?: string;
}
export declare const Sorting: (baseEntity: () => BaseEntity, options?: IFilterDecoratorParams) => (target: any, propertyName: any, paramIndex: any) => void;
export declare const GraphqlSorting: () => (target: any, property: any, descriptor: any) => void;
export declare const applySortingParameter: (args: any[], target: any, property: string) => void;
export {};
