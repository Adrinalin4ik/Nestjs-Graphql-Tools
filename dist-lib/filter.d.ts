import { BaseEntity } from "./common";
export declare enum OperationQuery {
    eq = "=",
    neq = "!=",
    gt = ">",
    gte = ">=",
    lt = "<",
    lte = "<=",
    in = "IN",
    like = "LIKE",
    notlike = "NOT LIKE",
    between = "BETWEEN",
    notbetween = "NOT BETWEEN",
    null = "IS NULL"
}
export declare enum InputMapPrefixes {
    PropertyFilterType = "PropertyFilterType",
    FilterInputType = "FilterInputType"
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
interface IFilterDecoratorParams {
    name?: string;
}
export declare const Filter: (baseEntity: () => BaseEntity, options?: IFilterDecoratorParams) => (target: any, propertyName: any, paramIndex: any) => void;
export declare const GraphqlFilter: () => (_target: any, _property: any, descriptor: any) => void;
export declare const applyFilterParameter: (args: any[]) => void;
export {};
