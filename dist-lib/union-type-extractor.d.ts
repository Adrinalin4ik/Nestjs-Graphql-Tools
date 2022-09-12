interface SelectedFieldsDecoratorParams {
    sqlAlias?: string;
}
export declare const SelectedUnionTypes: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | SelectedFieldsDecoratorParams)[]) => ParameterDecorator;
export {};
