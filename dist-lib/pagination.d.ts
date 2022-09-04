export interface PaginateDecoratorArgs {
    name?: string;
    nullable?: boolean;
}
export declare class PaginatorArgs {
    per_page: number;
    page: number;
}
export declare const Paginator: (options?: PaginateDecoratorArgs) => (target: any, propertyName: any, paramIndex: any) => void;
