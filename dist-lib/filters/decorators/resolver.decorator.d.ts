import { BaseEntity } from "../../common";
export interface IFilterDecoratorParams {
    sqlAlias?: string;
    name?: string;
}
export declare const GraphqlFilter: () => (target: any, property: any, descriptor: any) => void;
export declare const Filter: (baseEntity: () => BaseEntity | BaseEntity[], options?: IFilterDecoratorParams) => (target: any, propertyName: any, paramIndex: any) => void;
