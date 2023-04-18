import { ReturnTypeFunc } from "@nestjs/graphql";
export interface FilterFieldOptions {
    sqlExp?: string;
}
export interface FilterFieldExcludeOptions {
    exclude: boolean;
}
export declare class GraphqlFilterTypeDecoratorMetadata {
    private target;
    fields: Map<string, GraphqlFilterFieldMetadata>;
    excludedFilterFields: Set<string>;
    constructor(target: any);
    save(): void;
}
export interface GraphqlFilterFieldMetadata extends FilterFieldOptions {
    name: string;
    typeFn: ReturnTypeFunc;
}
export declare function FilterField(options: FilterFieldExcludeOptions): any;
export declare function FilterField(typeFn: ReturnTypeFunc, options?: FilterFieldOptions): any;
