import { Brackets } from "typeorm";
import { GraphqlFilterFieldMetadata } from "./decorators/field.decorator";
import { IFilterDecoratorParams } from "./decorators/resolver.decorator";
import { IFilter } from "./input-type-generator";
export declare const convertFilterParameters: <T>(parameters?: IFilter<T>, customFields?: Map<string, GraphqlFilterFieldMetadata>, options?: IFilterDecoratorParams) => Brackets | IFilter<T>;
