import { ReturnTypeFunc } from "@nestjs/graphql";
export declare const CUSTOM_FILTER_INPUT_TYPE_DECORATOR_NAME = "GraphqlFilterInputTypeDecorator";
export declare const CUSTOM_FILTER_INPUT_TYPE_PROPERTY_DECORATOR_NAME = "GraphqlFilterFieldTypeDecorator";
export declare const FilterInputType: () => (target: any) => void;
export interface FilterFieldOptions {
    sqlExp?: string;
}
export interface FilterInputTypeDecoratorMetadata {
    fields: FilterInputTypeFieldMetadata[];
}
export interface FilterInputTypeFieldMetadata {
    name: string;
    typeFn: ReturnTypeFunc;
    options: FilterFieldOptions;
}
export declare const FilterField: (typeFn: ReturnTypeFunc, options?: FilterFieldOptions) => (target: any, property: any) => void;
