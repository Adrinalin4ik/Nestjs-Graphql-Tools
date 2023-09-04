export interface PaginateDecoratorArgs {
    name?: string;
    nullable?: boolean;
}
declare class PaginatorArgsDto {
    per_page: number;
    page: number;
}
export interface PaginatorArgs extends PaginatorArgsDto {
}
export declare const Paginator: (options?: PaginateDecoratorArgs) => (target: any, propertyName: any, paramIndex: any) => void;
export {};
