export declare type ISortingMetadata = {
    _name_: string;
};
export declare type SortArgs<T> = {
    [K in keyof T]: 'ASC' | 'DESC';
};
export declare const applySortingParameter: (args: any[], target: any, property: string) => void;
