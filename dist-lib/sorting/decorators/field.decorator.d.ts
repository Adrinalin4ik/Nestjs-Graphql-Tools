export interface SortingFieldOptions {
    sqlExp?: string;
}
export interface SortingFieldExcludeOptions {
    exclude: boolean;
}
export interface GraphqlSortingTypeDecoratorMetadata {
    fields: Map<string, GraphqlSortingFieldMetadata>;
}
export interface GraphqlSortingFieldMetadata extends SortingFieldOptions {
    name: string;
}
export declare class GraphqlSortingTypeDecoratorMetadata {
    private target;
    fields: Map<string, GraphqlSortingFieldMetadata>;
    excludedSortingFields: Set<string>;
    constructor(target: any);
    save(): void;
}
export declare const SortingField: (options?: SortingFieldOptions | SortingFieldExcludeOptions) => (target: any, property: any) => void;
