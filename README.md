<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

<p align="center"><a href="http://nestjs.com/" target="_blank">NestJS</a> Graphql automation library for building performant API</p>
<p align="center">
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/nestjs-graphql-tools.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/nestjs-graphql-tools.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/nestjs-graphql-tools.svg" alt="NPM Downloads" /></a>
</p>

## Description

The library allows to build efficient graphql API helping overcome n+1 problem and building hasura-like search interface.

## Installation

```bash
$ npm i nestjs-graphql-tools
```

## Data Loader usage
  Loader usage guide
  1. Decorate your resolver with `@GraphqlLoader()`
  2. Add `@Loader()` parameter as a first parameter
  3. @Loader will return you LoaderData interface which includes ids of entities and helpers for constructing sutable object for graphql

```typescript
@Resolver(() => UserObjectType) 
export class UserResolver {

  @ResolveField(() => TaskObjectType)
  @GraphqlLoader()
  async tasks(
    @Loader() loader: LoaderData<TaskObjectType, number>,
    @Args('story_points') story_points: number, // custom search arg
  ) {
    const tasks = await getRepository(Task).find({
      where: {
        assignee_id: In<number>(loader.ids) // assignee_id is foreign key from Task to User table
        story_points
      }
    });

    return loader.helpers.mapOneToManyRelation(tasks, loader.ids, 'assignee_id'); // this helper will construct an object like { <assignee_id>: Task }. Graphql expects this shape.
  }
}
```

## Filters usage
  Loader usage guide
  1. Decorate your resolver with `@GraphqlFilter()` or `@GraphqlLoader()` (this one is already includes `@GraphqlFilter()` inside)
  2. Add `@Filter()` parameter with type of `Brackets` from typeorm library
  3. `@Filter()` will return typeorm compatible condition which you can use in your query builder

```typescript
@Resolver(() => UserObjectType)
export class UserResolver {
  constructor(
    @InjectRepository(Task) public readonly taskRepository: Repository<Task>,
    @InjectRepository(User) public readonly userRepository: Repository<User>
  ) {}

  @Query(() => [UserObjectType])
  @GraphqlFilter() // This decorator will put the data to the filter argument
  users(
    @Filter(() => UserObjectType) filter: Brackets, // It will return  typeorm condition
    @Args('task_title', {nullable: true}) taskTitle: string, // You can add custom additional filter if needed
  ) {
    const qb = this.userRepository.createQueryBuilder('u')
      .leftJoin('task', 't', 't.assignee_id = u.id')
      .where(filter)
      if (taskTitle) {
        qb.andWhere(`t.title ilike :title`, { title: `%${taskTitle}%` })
      }

    return qb.getMany()
  }
}
```


## Another examples
You can find another examples in the src folder

## License

NestJS Graphql tools is [MIT licensed](LICENSE).
