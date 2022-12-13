export interface SortingFieldOptions {
    sqlExp?: string;
}
export interface GraphqlSortingTypeDecoratorMetadata {
    fields: Map<string, GraphqlSortingFieldMetadata>;
}
export interface GraphqlSortingFieldMetadata extends SortingFieldOptions {
    name: string;
}
export declare const SortingField: (options?: SortingFieldOptions) => (target: any, property: any) => void;
