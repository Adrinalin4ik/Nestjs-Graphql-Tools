import {
  createParamDecorator,
  ExecutionContext
} from '@nestjs/common';
import { GraphQLResolveInfo } from 'graphql';
import { IncomingMessage } from 'http';
import { groupBy } from 'lodash';
import { applyFilterParameter, GRAPHQL_FILTER_DECORATOR_METADATA_KEY } from './filter';
import { applySortingParameter, GRAPHQL_SORTING_DECORATOR_METADATA_KEY } from './sorting';
import { SelectedUnionTypesResult } from './union-type-extractor';
const DataLoader = require('dataloader');

export const LOADER_DECORATOR_NAME_METADATA_KEY = 'LoaderPropertyDecorator';

/*
  Loader usage guide
  1. Decorate your resolver with @GraphqlLoader()
  2. Add @Loader() parameter as a first parameter
  3. @Loader will return you LoaderData interface which includes ids of entities and helpers for constructing sutable object for graphql

  Example:
  @Resolver(() => UserObjectType) export class UserResolver {

  @ResolveField(() => TaskObjectType)
  @GraphqlLoader()
  async tasks(
    @Loader() loader: LoaderData<TaskObjectType, number>,
    @Args('story_points') story_points: number,
  ) {
    // console.log(ids, story_points)
    const tasks = await getRepository(Task).find({
      where: {
        assignee_id: In<number>(loader.ids) // assignee_id is foreign key from Task to User table
        story_points
      }
    });

    return loader.helpers.mapOneToManyRelation(tasks, loader.ids, 'assignee_id'); // this helper will construct an object like { <assignee_id>: Task }. Graphql expects this shape.
  }
}
*/

export interface LoaderHelper<DtoType> {
  mapOneToManyRelation: (
    entities: object[],
    ids: any[],
    foreignKey: string
  ) => { [key: string]: DtoType };
  mapOneToManyPolymorphicRelation: (
    entities: {descriminator: string, entities: object[]}[],
    typeIds: {descriminator: string | any, id: any},
    foreignKey?: string
  ) => { [key: string]: DtoType };
  mapManyToOneRelation: (
    entities: object[],
    ids: any[],
    foreignKey?: string
  ) => { [key: string]: DtoType };
}

export interface ILoaderInstance<DtoType, IdType> {
  _loader: { [key: string]: any};
}

export interface LoaderData<DtoType, IdType> {
  name: string,
  parent: any;
  ids: IdType[];
  polimorphicTypes: IdType[];
  ctx: ExecutionContext;
  info: GraphQLResolveInfo;
  req: IncomingMessage & ILoaderInstance<DtoType, IdType>;
  helpers: LoaderHelper<DtoType>;
}

export interface PolymorphicLoaderData<DtoType, IdType, DescriminatorType> {
  name: string,
  parent: any;
  ids: { descriminator: DescriminatorType, id: IdType };
  polimorphicTypes: { descriminator: DescriminatorType, ids: IdType[] }[];
  ctx: ExecutionContext;
  info: GraphQLResolveInfo;
  req: IncomingMessage & ILoaderInstance<DtoType, IdType>;
  helpers: LoaderHelper<DtoType>;
  selectedUnions: SelectedUnionTypesResult;
}

export interface GraphqlLoaderOptions {
  /** Parent ID. It works pretty straight forward. It takes parent[foreignKey] and accumulates in loader.ids */
  foreignKey?: string;
  polymorphic?: {
    idField: string;
    typeField: string;
  }
}

export const Loader = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const args = ctx.getArgs();
  const { req } = args[2];
  const info = args[3];
  return {
    _name_: LOADER_DECORATOR_NAME_METADATA_KEY,
    parent: args[0],
    ctx,
    info,
    req,
    helpers: {
      mapOneToManyRelation,
      mapOneToManyPolymorphicRelation,
      mapManyToOneRelation,
    },
  };
});

export const GraphqlLoader = (
  args?: GraphqlLoaderOptions
) => {
  const options = {
    foreignKey: 'id',
    ...args
  }
  
  return (target, property, descriptor) => {
    const actualDescriptor = descriptor.value;
    descriptor.value = function(...args) {
      // Processing other decorators in case if they weren't added explicitly
      if (!Reflect.hasMetadata(GRAPHQL_FILTER_DECORATOR_METADATA_KEY, target, property)) {
        applyFilterParameter(args, target, property);
      }
      if (!Reflect.hasMetadata(GRAPHQL_SORTING_DECORATOR_METADATA_KEY, target, property)) {
        applySortingParameter(args, target, property);
      }

      const loader = args.find(x => x?._name_ === LOADER_DECORATOR_NAME_METADATA_KEY) as LoaderData<any, any> | PolymorphicLoaderData<any, any, any>;
      const loaderKey = `${concatPath(loader.info.path)}.${target.constructor.name}.${property}`;
      if (!loader || !loader.parent) {
        throw new Error('@Loader parameter decorator is not first parameter or missing');
      }

      if (!loader.req) {
        loader.req = {} as IncomingMessage & ILoaderInstance<any, any>;
      }

      if (!loader.req._loader) {
        loader.req._loader = {};
      }

      if (!loader.req._loader[loaderKey]) {
        loader.req._loader[loaderKey] = new DataLoader(async ids => {
          if (options.polymorphic) {
            const polyLoader = loader as PolymorphicLoaderData<any, any, any>
            
            const gs = groupBy(ids, 'descriminator');
            polyLoader.polimorphicTypes = Object.entries(gs).reduce((acc, [descriminator, entities]) => {
              acc.push({
                descriminator,
                ids: (entities as any[]).map(x => x.id)
              })
              return acc;
            }, []);

            polyLoader.ids = ids as any;
          } else {
            loader.ids = ids as any[];
          }
          
          return actualDescriptor.call(this, ...args);
        });
      }
      if (options.polymorphic) {
        if (loader.parent[options.polymorphic.idField] && loader.parent[options.polymorphic.typeField]) {
          return loader.req._loader[loaderKey].load({
            id: loader.parent[options.polymorphic.idField], 
            descriminator: loader.parent[options.polymorphic.typeField]
          } as any);
        } else {
          throw new Error(`Polymorphic relation Error: Your parent model must provide ${options.polymorphic.idField} and ${options.polymorphic.typeField}`);
        }
      } else {
        if (loader.parent[options.foreignKey]) {
          return loader.req._loader[loaderKey].load(loader.parent[options.foreignKey]);
        }
      }
    };
  };
};

export const mapOneToManyRelation = (
  entities: object[],
  ids: any[],
  foreignKey
) => {
  const gs = groupBy(entities, foreignKey);
  const res = ids.map(k => gs[k] || []);
  return res;
};

function mapManyToOneRelation(entities: object[], ids:any[], foreignKey: string = 'id') {
  const mappedEntities = entities.reduce((acc: object, e: any) => {
    acc[e[foreignKey]] = e;
    return acc;
  }, {});

  return ids.map(k => mappedEntities[k]);
}

export const mapOneToManyPolymorphicRelation = (
  entities: {descriminator: string, entities: object[]}[],
  typeIds: {descriminator: string | any, id: any}[],
  foreignKey = 'id'
) => {
  const gs = entities.reduce((acc, union) => {
    union.entities.forEach(entity => {
      const key = `${union.descriminator}_${entity[foreignKey]}`
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push({
        ...entity,
        '__UnionDescriminator__': union.descriminator
      })
    })
    
    return acc;
  }, {})

  const res = typeIds.map(type => gs[`${type.descriminator}_${type.id}`] || null);
  return res;
};

const concatPath = (path: any, acc?: string) => {
  if (path.typename !== 'Query' && path.typename !== 'Subscription' && path.typename !== 'Mutation') {
    if (typeof path.key === 'number') {
      return concatPath(path.prev, acc);
    } else {
      return concatPath(path.prev, path.key + (acc ? '.' + acc : ''));
    }
  } else {
    return acc;
  }
}