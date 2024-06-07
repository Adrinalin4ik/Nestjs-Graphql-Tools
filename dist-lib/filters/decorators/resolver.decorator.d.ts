import { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { Brackets } from "typeorm";
import { BaseEntity } from "../../common";
import { GraphqlFilterFieldMetadata } from "./field.decorator";
export interface IFilterDecoratorParams {
    sqlAlias?: string;
    name?: string;
    raw?: boolean;
}
export declare const GraphqlFilter: () => (target: any, property: any, descriptor: any) => void;
export declare const Filter: (baseEntity: () => BaseEntity | BaseEntity[], options?: IFilterDecoratorParams) => (target: any, propertyName: any, paramIndex: any) => void;
export interface IFilterPipeArgs {
    options: IFilterDecoratorParams;
    customFields: Map<string, GraphqlFilterFieldMetadata>;
}
export interface FilterArgs extends Brackets {
}
export declare class FilterPipe implements PipeTransform {
    readonly args: IFilterPipeArgs;
    constructor(args: IFilterPipeArgs);
    transform(value: any, _metadata: ArgumentMetadata): Brackets | import("../input-type-generator").IFilter<unknown>;
}
