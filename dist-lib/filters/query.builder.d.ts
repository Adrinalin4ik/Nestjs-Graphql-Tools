import { Brackets } from "typeorm";
import { GraphqlFilterFieldMetadata } from "./decorators/field.decorator";
import { IFilterDecoratorParams } from "./decorators/resolver.decorator";
import { IFilter } from "./input-type-generator";
export declare enum EOperationType {
    AND = 0,
    OR = 1
}
export declare const convertFilterParameters: <T>(parameters?: IFilter<T>[], opType?: EOperationType, customFields?: Map<string, GraphqlFilterFieldMetadata>, options?: IFilterDecoratorParams) => Brackets | IFilter<T>[];
