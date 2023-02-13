export interface BaseEntity extends Function {
    new (...any: any[]): any;
    [key: string]: any;
}
