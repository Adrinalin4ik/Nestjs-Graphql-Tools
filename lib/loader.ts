import {
  createParamDecorator,
  ExecutionContext
} from '@nestjs/common';
import DataLoader from 'dataloader';
import { IncomingMessage } from 'http';
import { groupBy } from 'lodash';
import { applyFilterParameter } from './filter';
import { applySortingParameter } from './sorting';

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
  mapManyToOneRelation: (
    entities: object[],
    ids: any[],
    foreignKey?: string
  ) => { [key: string]: DtoType };
}

export interface ILoaderInstance<DtoType, IdType> {
  _loader: { [key: string]: DataLoader<DtoType[], IdType[]> };
}

export interface LoaderData<DtoType, IdType> {
  name: string,
  parent: any;
  ids: IdType[];
  polimorphicTypes: IdType[];
  ctx: ExecutionContext;
  req: IncomingMessage & ILoaderInstance<DtoType, IdType>;
  helpers: LoaderHelper<DtoType>;
}

export interface GraphqlLoaderOptions {
  foreignKey?: string;
  polymorphic?: {
    idField: string;
    typeField: string;
  }
}

export const Loader = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const args = ctx.getArgs();
  const { req } = args[2];
  return {
    _name_: 'LoaderPropertyDecorator',
    parent: args[0],
    ctx,
    req,
    helpers: {
      mapOneToManyRelation,
      mapManyToOneRelation,
    },
  };
});

export const GraphqlLoader = (
  options: GraphqlLoaderOptions = {
    foreignKey: 'id',
  }
) => {
  return (target, property, descriptor) => {
    const loaderKey = `${target.constructor.name}.${property}`;
    const actualDescriptor = descriptor.value;
    descriptor.value = function(...args) {
      applyFilterParameter(args);
      applySortingParameter(args);
      const loader = args.find(x => x?._name_ === 'LoaderPropertyDecorator') as LoaderData<any, any>;
      if (!loader || !loader.parent) {
        throw new Error('@Loader parameter decorator is not first parameter or missing');
      }
      if (!loader.req._loader) {
        loader.req._loader = {};
      }
      if (!loader.req._loader[loaderKey]) {
        loader.req._loader[loaderKey] = new DataLoader(async ids => {
          if (options.polymorphic) {
            const gs = groupBy(ids, 'type');
            loader.polimorphicTypes = Object.entries(gs).reduce((acc, [type, entities]) => {
              acc.push({
                type,
                ids: (entities as any[]).map(x => x.id)
              })
              return acc;
            }, []);

            loader.ids = (ids as any[]).map(x => x.id);
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
            type: loader.parent[options.polymorphic.typeField]
          } as any);
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
