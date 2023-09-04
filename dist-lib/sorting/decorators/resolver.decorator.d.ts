import { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { BaseEntity } from "../../common";
import { GraphqlSortingFieldMetadata } from "./field.decorator";
export interface ISortingDecoratorParams {
    name?: string;
    sqlAlias?: string;
}
export declare const GraphqlSorting: () => (target: any, property: any, descriptor: any) => void;
export declare const Sorting: (baseEntity: () => BaseEntity | BaseEntity[], options?: ISortingDecoratorParams) => (target: any, propertyName: any, paramIndex: any) => void;
export interface ISortingPipeArgs {
    options: ISortingDecoratorParams;
    customFields: Map<string, GraphqlSortingFieldMetadata>;
}
export declare class SortingPipe implements PipeTransform {
    readonly args: ISortingPipeArgs;
    constructor(args: ISortingPipeArgs);
    transform(value: any, _metadata: ArgumentMetadata): {};
}
