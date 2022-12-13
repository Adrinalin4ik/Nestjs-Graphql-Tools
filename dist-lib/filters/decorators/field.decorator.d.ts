import { ReturnTypeFunc } from "@nestjs/graphql";
export interface FilterFieldOptions {
    sqlExp?: string;
}
export interface GraphqlFilterTypeDecoratorMetadata {
    fields: Map<string, GraphqlFilterFieldMetadata>;
}
export interface GraphqlFilterFieldMetadata extends FilterFieldOptions {
    name: string;
    typeFn: ReturnTypeFunc;
}
export declare const FilterField: (typeFn: ReturnTypeFunc, options?: FilterFieldOptions) => (target: any, property: any) => void;
