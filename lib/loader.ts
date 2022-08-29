import {
  createParamDecorator,
  ExecutionContext
} from '@nestjs/common';
import DataLoader from 'dataloader';
import { IncomingMessage } from 'http';
import { groupBy } from 'lodash';
import { applyFilterParameter } from './filter';

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
    ids: number[] | string[],
    foreignKey: string
  ) => { [key: string]: DtoType };
  mapManyToOneRelation: (
    entities: object[],
    ids: number[] | string[]
  ) => { [key: string]: DtoType };
}

export interface ILoaderInstance<DtoType, IdType> {
  _loader: { [key: string]: DataLoader<DtoType[], IdType[]> };
}

export interface LoaderData<DtoType, IdType> {
  name: string,
  parent: any;
  ids: IdType[];
  ctx: ExecutionContext;
  req: IncomingMessage & ILoaderInstance<DtoType, IdType>;
  helpers: LoaderHelper<DtoType>;
}

export interface GraphqlLoaderOptions {
  foreignKey?: string;
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
      const loader = args.find(x => x?._name_ === 'LoaderPropertyDecorator') as LoaderData<any, any>;
      if (!loader || !loader.parent) {
        throw new Error('@Loader parameter decorator is not first parameter or missing');
      }
      if (!loader.req._loader) {
        loader.req._loader = {};
      }
      if (!loader.req._loader[loaderKey]) {
        loader.req._loader[loaderKey] = new DataLoader(async ids => {
          loader.ids = ids as any[];
          return actualDescriptor.call(this, ...args);
        });
      }
      if (loader.parent[options.foreignKey]) {
        return loader.req._loader[loaderKey].load(loader.parent[options.foreignKey]);
      }
    };
  };
};

export const mapOneToManyRelation = (
  entities: object[],
  ids: number[] | string[],
  foreignKey
) => {
  const gs = groupBy(entities, foreignKey);
  const res = ids.map(k => gs[k] || []);
  return res;
};

function mapManyToOneRelation(entities: object[], ids: number[] | string[]) {
  const mappedEntities = entities.reduce((acc: object, e: any) => {
    acc[e.id] = e;
    return acc;
  }, {});

  return ids.map(k => mappedEntities[k]);
}
