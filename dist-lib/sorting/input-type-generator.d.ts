import { ReturnTypeFunc } from "@nestjs/graphql";
import { BaseEntity } from "../common";
export declare enum SortType {
    ASC = "ASC",
    DESC = "DESC",
    ASC_NULLS_LAST = "ASC NULLS LAST",
    ASC_NULLS_FIRST = "ASC NULLS FIRST",
    DESC_NULLS_LAST = "DESC NULLS LAST",
    DESC_NULLS_FIRST = "DESC NULLS FIRST"
}
export declare enum SortInputMapPrefixes {
    SortingInputType = "SortingInputType"
}
export interface SortingFieldDefinition {
    name: string;
    typeFn?: ReturnTypeFunc;
}
export declare const getSortingFullInputType: (classes: BaseEntity[], name: string) => any;
