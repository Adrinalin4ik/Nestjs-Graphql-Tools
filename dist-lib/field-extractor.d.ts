import { ExecutionContext } from '@nestjs/common';
import { FragmentDefinitionNode, SelectionNode } from 'graphql';
export declare const GraphqlFieldMetadataKey = "graphql:fieldsData";
export interface SelectedFieldsDecoratorParams {
    sqlAlias?: string;
}
export interface SelectedFieldsResult {
    ctx: ExecutionContext;
    fieldsData: {
        rowFieldsData: Set<string>;
        fieldsString: string[];
    };
}
export declare const SelectedFields: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | SelectedFieldsDecoratorParams)[]) => ParameterDecorator;
export declare function extractFieldsData(resolvers: ReadonlyArray<SelectionNode>, field: string, fragments: {
    [key: string]: FragmentDefinitionNode;
}, from_fragment?: boolean): Set<string>;
