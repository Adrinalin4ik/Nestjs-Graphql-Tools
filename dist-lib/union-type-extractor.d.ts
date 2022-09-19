import { FragmentDefinitionNode, SelectionNode } from 'graphql';
interface SelectedFieldsDecoratorParams {
    sqlAlias?: string;
    nestedPolymorphicResolverName?: string;
}
export interface SelectedUnionTypesResult {
    has: (key: any) => boolean;
    getFields: (key: any) => string[];
    types: Map<any, any[]>;
}
export declare const SelectedUnionTypes: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | SelectedFieldsDecoratorParams)[]) => ParameterDecorator;
export declare function getSelectedUnionTypes(info: any, options?: SelectedFieldsDecoratorParams): SelectedUnionTypesResult;
export declare function extractUnionsData(resolvers: ReadonlyArray<SelectionNode>, field: string, fragments: {
    [key: string]: FragmentDefinitionNode;
}): Map<unknown, unknown>;
export {};
