<p align="center">
  <a href="https://www.npmjs.com/package/nestjs-graphql-tools" target="blank"><img src="https://raw.githubusercontent.com/Adrinalin4ik/Nestjs-Graphql-Tools/master/images/svg.svg" width="200" alt="NestJS Graphql tools Logo" /></a>
</p>

<p align="center"><a href="http://nestjs.com/" target="_blank">NestJS</a> Graphql automation library for building performant API</p>
<p align="center">
  <a href="https://www.npmjs.com/package/nestjs-graphql-tools" target="_blank"><img src="https://img.shields.io/npm/v/nestjs-graphql-tools.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/nestjs-graphql-tools" target="_blank"><img src="https://img.shields.io/npm/l/nestjs-graphql-tools.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/nestjs-graphql-tools" target="_blank"><img src="https://img.shields.io/npm/dm/nestjs-graphql-tools.svg" alt="NPM Downloads" /></a>
</p>

## Description

The library allows to build efficient graphql API helping overcome n+1 problem and building hasura-like search interface with the minimum dependencies.

## Overview
- [Loader](#data-loader-n1-resolver)
- [Filtering](#filters)
- [Pagination](#pagination)
- [Sorting](#sorting)
- [Field extraction](#field-extraction)
- [More examples](#another-examples)


## Installation

```bash
$ npm i nestjs-graphql-tools
```

## Data Loader n+1 resolver
#### Loader usage guide
  1. Decorate your resolver with `@GraphqlLoader()`
  2. Add `@Loader()` parameter as a first parameter
  3. @Loader will return you LoaderData interface which includes ids of entities and helpers for constructing sutable object for graphql

##### Example 1. One to many example.

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

##### Example 2. Many to one relation.
```typescript
@Resolver(() => TaskObjectType)
export class TaskResolver {

  constructor(
    @InjectRepository(User) public readonly userRepository: Repository<User>
  ) {}

  @ResolveField(() => UserObjectType)
  @GraphqlLoader({
    foreignKey: 'assignee_id' // Here we're providing foreigh key. Decorator gather all the keys from parent and provide it in loader.ids
  })
  async assignee(
    @Loader() loader: LoaderData<TaskObjectType, number>,
    @Filter(() => UserObjectType) filter: Brackets,
  ) {
    const qb = this.userRepository.createQueryBuilder('u')
      .where(filter)
      .andWhere({
        id: In(loader.ids) // Here will be assigne_ids
      })
    const users = await qb.getMany();
    return loader.helpers.mapManyToOneRelation(users, loader.ids); // This helper provide the shape {assignee_id: User}
  }
}
```

## Filters
Filter is giving ability to filter out entities by the condition. Condition looks similar to hasura interface using operators `eq, neq, gt, gte, lt, lte, in, like, notlike, between, notbetween, null`

##### Example 1

```graphql
{
  users(where: {id: {eq: 1}}) {
    id
  }
}
```
##### Example 2
```graphql
{
  users(
    where: {
      and: [
        {
          email: {like: "yahoo.com"}
        }
        {
          email: {like: "google.com"}
        }
      ],
      or: {
        id: {
          between: [1,2,3]
        }
      }
    }
  ) {
    id
  }
}
```

#### Filter usage guide
1. Decorate your resolver with `@GraphqlFilter()` or `@GraphqlLoader()` (this one is already includes `@GraphqlFilter()` inside)
2. Add `@Filter()` parameter with type of `Brackets` from typeorm library
3. `@Filter()` will return typeorm compatible condition which you can use in your query builder.

##### Example 1. Query.

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

##### Example 2. Combination with loader

```typescript
@Resolver(() => UserObjectType)
export class UserResolver {
  constructor(@InjectRepository(Task) public readonly taskRepository: Repository<Task>) {}

  @ResolveField(() => TaskObjectType)
  @GraphqlLoader() // This decorator already includes @GraphqlFilter()
  async tasks(
    @Loader() loader: LoaderData<TaskObjectType, number>,
    @Filter(() => TaskObjectType) filter: Brackets,
  ) {
    const qb = this.taskRepository.createQueryBuilder()
    .where(filter)
    .andWhere({
      assignee_id: In<number>(loader.ids)
    });

    const tasks = await qb.getMany();
    
    return loader.helpers.mapOneToManyRelation(tasks, loader.ids, 'assignee_id');
  }
}
```

## Pagination
The library provides parameter decorator `@Paginator()` for the pagination. This decorator returns object like that

```typescript
{
  [property]: '[ORDER] [NULLS ORDER]'
}

Example:
{
  title: 'ASC',
  id: 'ASC NULLS LAST'
}
```

##### Full example

```typescript
@Resolver(() => TaskObjectType)
export class TaskResolver {
  constructor(@InjectRepository(Task) public readonly taskRepository: Repository<Task>) {}

  @Query(() => [TaskObjectType])
  async tasks(
   @Paginator() paginator: PaginatorArgs,
  ) {
    const qb = this.taskRepository.createQueryBuilder('t');
    
    if (paginator) {
      qb.offset(paginator.page).limit(paginator.per_page)
    }

    return qb.getMany();
  }
}
```

## Sorting
The library provides ability to make sorting. To make sorting works you need to decorate your resolver with `@GraphqlSorting()` or `@GraphqlLoader()`

##### Example 1
```typescript
@Resolver(() => TaskObjectType)
export class TaskResolver {
  constructor(@InjectRepository(Task) public readonly taskRepository: Repository<Task>) {}

  @Query(() => [TaskObjectType])
  @GraphqlSorting()
  async tasks(
   @Sorting(() => TaskObjectType) sorting: SortArgs<TaskObjectType>
  ) {
    const qb = this.taskRepository.createQueryBuilder('t');
    
    if (sorting) {
      qb.orderBy(sorting);
    }
    return qb.getMany();
  }
}
```

## Field extraction
The library allows to gather only requested field from the query and provides it as an array to the parameter variable.

##### Example

Simple graphql query
```graphql
{
  tasks {
    id
    title
  }
}

```
Resolver

```typescript
@Resolver(() => TaskObjectType)
export class TaskResolver {
  constructor(@InjectRepository(Task) public readonly taskRepository: Repository<Task>) {}

  @Query(() => [TaskObjectType])
  @GraphqlFilter()
  async tasks(
   @Filter(() => TaskObjectType) filter: Brackets,
   @SelectedFields({sqlAlias: 't'}) selectedFields: SelectedFieldsResult // Requested fields will be here. sqlAlias is optional thing. It useful in case if you're using alias in query builder
  ) {
    const res = await this.taskRepository.createQueryBuilder('t')
      .select(selectedFields.fieldsData.fieldsString) // fieldsString return array of strings
      .where(filter)
      .getMany();
    return res;
  }
}
```

The query will generate typeorm request with only requested fields
```sql
SELECT "t"."id" AS "t_id", "t"."title" AS "t_title" FROM "task" "t"
```


## More examples
You can find another examples in the src folder

How to run it:

1. Create a database
```bash
$ sudo su postgres
$ psql
$ create database nestjs_graphql_tools_development;
```
Then create new records

2. Fill out database config in `config/default.json`
3. Run dev server
```bash
$ npm i
$ npm run start:dev
```

## License

NestJS Graphql tools is [MIT licensed](LICENSE).
