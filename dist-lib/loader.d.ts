/// <reference types="node" />
import { ExecutionContext } from '@nestjs/common';
import DataLoader from 'dataloader';
import { IncomingMessage } from 'http';
export interface LoaderHelper<DtoType> {
    mapOneToManyRelation: (entities: object[], ids: number[] | string[], foreignKey: string) => {
        [key: string]: DtoType;
    };
    mapManyToOneRelation: (entities: object[], ids: number[] | string[]) => {
        [key: string]: DtoType;
    };
}
export interface ILoaderInstance<DtoType, IdType> {
    _loader: {
        [key: string]: DataLoader<DtoType[], IdType[]>;
    };
}
export interface LoaderData<DtoType, IdType> {
    name: string;
    parent: any;
    ids: IdType[];
    ctx: ExecutionContext;
    req: IncomingMessage & ILoaderInstance<DtoType, IdType>;
    helpers: LoaderHelper<DtoType>;
}
export interface GraphqlLoaderOptions {
    foreignKey?: string;
}
export declare const Loader: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const GraphqlLoader: (options?: GraphqlLoaderOptions) => (target: any, property: any, descriptor: any) => void;
export declare const mapOneToManyRelation: (entities: object[], ids: number[] | string[], foreignKey: any) => any[];
