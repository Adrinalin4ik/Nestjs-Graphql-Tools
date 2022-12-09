import { ReturnTypeFunc } from "@nestjs/graphql";
import { BaseEntity } from "./common";
export declare const GRAPHQL_FILTER_DECORATOR_METADATA_KEY = "GraphqlFilterDecorator";
export declare const FILTER_DECORATOR_NAME_METADATA_KEY = "FilterPropertyDecorator";
export declare const FILTER_DECORATOR_OPTIONS_METADATA_KEY = "FilterPropertyDecoratorOptions";
export declare enum OperationQuery {
    eq = "eq",
    neq = "neq",
    gt = "gt",
    gte = "gte",
    lt = "lt",
    lte = "lte",
    in = "in",
    notin = "notin",
    like = "like",
    notlike = "notlike",
    between = "between",
    notbetween = "notbetween",
    null = "null"
}
export declare enum InputMapPrefixes {
    PropertyFilterType = "PropertyFilterType",
    FilterInputType = "FilterInputType"
}
export interface FilterFieldDefinition {
    name: string;
    typeFn: ReturnTypeFunc;
}
export interface CustomFilterFieldDefinition extends FilterFieldDefinition {
    sqlExp: string;
}
export interface CustomFilters {
    disableDefaultFilters?: boolean;
    fields: CustomFilterFieldDefinition[];
}
export interface IFilterDecoratorParams {
    name?: string;
    customFilters?: CustomFilters;
}
export declare type IFilterField<T> = {
    [K in keyof T]: {
        eq: T[K];
        neq: T[K];
        gt: T[K];
        gte: T[K];
        lt: T[K];
        lte: T[K];
        in: T[K];
        like: T[K];
        notlike: T[K];
        between: T[K];
        notbetween: T[K];
        null: T[K];
    };
};
export interface IFilter<T> {
    and: IFilterField<T>[];
    or: IFilterField<T>[];
    _name_: string;
}
export declare const Filter: (baseEntity: () => BaseEntity, options?: IFilterDecoratorParams) => (target: any, propertyName: any, paramIndex: any) => void;
export declare const GraphqlFilter: () => (target: any, property: any, descriptor: any) => void;
export declare const applyFilterParameter: (args: any[], target: any, property: string) => void;
