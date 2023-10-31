import {
  createParamDecorator,
  ExecutionContext,
  Inject,
  Optional
} from '@nestjs/common';
import { GraphQLResolveInfo } from 'graphql';
import { IncomingMessage } from 'http';
import { groupBy } from 'lodash';
import { SelectedUnionTypesResult } from './union-type-extractor';
import { CacheInterceptor } from './caching';
import { from, lastValueFrom, of } from 'rxjs';
import { GraphqlToolsConfig, GraphqlToolsConfigToken } from './graphql-tools.module';
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
  ) => [DtoType[]];
  mapOneToManyPolymorphicRelation: (
    entities: {descriminator: string, entities: object[]}[],
    typeIds: {descriminator: string | any, id: any},
    foreignKey?: string
  ) => [DtoType[]];
  mapManyToOneRelation: (
    entities: object[],
    ids: any[],
    foreignKey?: string
  ) => [DtoType[]];
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
  /** Parent ID. It works pretty straightforward. It takes parent[foreignKey] and accumulates in loader.ids */
  foreignKey?: string | ((parent: any) => (any));
  polymorphic?: ({
    id:  string;
    descriminator:  string;
  }) | ((parent: any) => ({ id: any; descriminator: any })),
}

export const Loader = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const args = ctx.getArgs();
  const { req } = args.find(x => x.req);;
  const info = args.find(x => x.fieldName);

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
  const cacheInterceptorInjector = Inject(CacheInterceptor);
  const graphqlToolsConfigInjector = Inject(GraphqlToolsConfigToken);
  return (target, property, descriptor) => {
    graphqlToolsConfigInjector(target, 'graphqlToolsConfigInjector');
    cacheInterceptorInjector(target, 'cacheInterceptor');
    Optional()(target, 'cacheInterceptor');
    
    const actualDescriptor = descriptor.value;
    descriptor.value = async function(...args) {
      const loader = args.find(x => x?._name_ === LOADER_DECORATOR_NAME_METADATA_KEY) as LoaderData<any, any> | PolymorphicLoaderData<any, any, any>;
      const loaderKey = `${concatPath(loader.info.path)}.${target.constructor.name}.${property}`;
      if (!loader || !loader.parent) {
        throw new Error('@Loader parameter decorator is not first parameter or missing');
      }

      if (!loader.req) {
        loader.req = {} as IncomingMessage & ILoaderInstance<any, any>;
      }

      if (!loader.req._loader) {
        // const cachedValueObserver = await this.cacheInterceptor.intercept(loader.ctx, {
        //   handle: () => of(loader.ctx.getHandler())
        // });

        // const cachedValue = await lastValueFrom(cachedValueObserver)

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
          
          let result; 
          
          if (this.graphqlToolsConfigInjector?.caching?.enabled && this.graphqlToolsConfigInjector?.caching?.globalCaching?.resolveFieldCaching) {
            
            const cachedValueObserver = await this.cacheInterceptor.intercept(loader.ctx, {
              handle: () => from(actualDescriptor.call(this, ...args))
            }, [ids]);
    
            result = await lastValueFrom(cachedValueObserver)
          } else {
            result = await actualDescriptor.call(this, ...args);
          }

          // Clean up context
          loader.req._loader = [];
          return result;
        });
      }
      if (options.polymorphic) {
        if (typeof options.polymorphic === 'function') {
          return loader.req._loader[loaderKey].load(options.polymorphic(loader.parent));
        } else if (loader.parent[options.polymorphic.id] && loader.parent[options.polymorphic.descriminator]) {
          return loader.req._loader[loaderKey].load({
            id: loader.parent[options.polymorphic.id], 
            descriminator: loader.parent[options.polymorphic.descriminator]
          });
        } else {
          throw new Error(`[${target.constructor.name}.${property}] Polymorphic relation Error: Your parent model must provide id and type for the nested model`);
        }
      } else {
        if (typeof options.foreignKey === 'function') {
          return loader.req._loader[loaderKey].load(options.foreignKey(loader.parent));
        } else if (loader.parent.hasOwnProperty(options.foreignKey)) {
          if (loader.parent[options.foreignKey]) {
            return loader.req._loader[loaderKey].load(loader.parent[options.foreignKey]);
          }
        } else {
          throw new Error(`[${target.constructor.name}.${property}] Can't find field "${options.foreignKey}" in the parent object. You should request "${options.foreignKey}" in the parent of "${property}" in the graphql query.`)
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