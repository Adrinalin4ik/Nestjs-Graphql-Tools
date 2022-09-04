import { BaseEntity } from "./common";
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
}
export declare const Sorting: (baseEntity: () => BaseEntity, options?: IFilterDecoratorParams) => (target: any, propertyName: any, paramIndex: any) => void;
export declare const GraphqlSorting: () => (_target: any, _property: any, descriptor: any) => void;
export declare const applySortingParameter: (args: any[]) => void;
export {};
