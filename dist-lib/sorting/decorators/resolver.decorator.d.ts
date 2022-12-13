import { BaseEntity } from "../../common";
export interface ISortingDecoratorParams {
    name?: string;
    sqlAlias?: string;
}
export declare const GraphqlSorting: () => (target: any, property: any, descriptor: any) => void;
export declare const Sorting: (baseEntity: () => BaseEntity | BaseEntity[], options?: ISortingDecoratorParams) => (target: any, propertyName: any, paramIndex: any) => void;
