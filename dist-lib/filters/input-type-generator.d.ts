import { ReturnTypeFunc } from "@nestjs/graphql";
import { BaseEntity } from "../common";
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
    PropertyFilterInputType = "PropertyFilterInputType",
    FilterInputType = "FilterInputType"
}
export interface FilterFieldDefinition {
    name: string;
    typeFn: ReturnTypeFunc;
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
export declare const getFilterFullInputType: (classes: BaseEntity[], name: string) => any;
