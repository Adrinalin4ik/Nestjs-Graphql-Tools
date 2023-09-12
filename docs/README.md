<p align="center">
  <a href="https://www.npmjs.com/package/nestjs-graphql-tools" target="blank"><img src="https://raw.githubusercontent.com/Adrinalin4ik/Nestjs-Graphql-Tools/master/images/svg.svg" width="200" alt="NestJS Graphql tools Logo" /></a>
</p>
<h1 align="center">NestJS graphql Tools</h1>
<p align="center"><a href="http://nestjs.com/" target="_blank">NestJS</a> Graphql automation library for building performant API</p>
<p align="center">
  <a href="https://www.npmjs.com/package/nestjs-graphql-tools" target="_blank"><img src="https://img.shields.io/npm/v/nestjs-graphql-tools.svg" alt="NPM Version" /></a>
  <a href="https://www.npmjs.com/package/nestjs-graphql-tools" target="_blank"><img src="https://img.shields.io/npm/l/nestjs-graphql-tools.svg" alt="Package License" /></a>
  <a href="https://www.npmjs.com/package/nestjs-graphql-tools" target="_blank"><img src="https://img.shields.io/npm/dm/nestjs-graphql-tools.svg" alt="NPM Downloads" /></a>
</p>


## Description

The library allows to build efficient graphql API helping overcome n+1 problem and building hasura-like search interface with the minimum dependencies.

## Introduction
With the library you will be able to build queries like that easily, using decorators and having full controll over everything.
```graphql
{
  users(
    where: {
      id: { in: [1,2,3,4] }
      task_title: { like: "%Task%" }
    }
    order_by: {email: ASC, created_at: DESC}
    paginate: {page: 1, per_page: 10}
  ) {
    id
    fname
    lname
    email
    tasks(order_by: {id: ASC_NULLS_LAST}) {
      id
      title
    }
  }
}

```

## Overview
- [Description](#description)
- [Introduction](#introduction)
- [Overview](#overview)
- [Installation](#installation)
- [Data Loader n+1 problem solver](#data-loader-n1-problem-solver)
    - [Loader usage guide](#loader-usage-guide)
      - [One to many example](#one-to-many-example)
      - [Many to one relation](#many-to-one-relation)
- [Polymorphic relations](#polymorphic-relations)
    - [Usage](#usage)
      - [Example](#example)
- [Filters](#filters)
      - [Basic example 1](#basic-example-1)
      - [Basic example 2](#basic-example-2)
    - [Filter usage guide](#filter-usage-guide)
      - [@Query with filters](#query-with-filters)
      - [@ResolveField with filter](#resolvefield-with-filter)
      - [Custom filters](#custom-filters)
- [Sorting](#sorting)
      - [Basic example](#basic-example)
      - [Custom sorting fields](#custom-sorting-fields)
- [Exclusions](#exclusions)
      - [Exclude field from filters and sortings](#exclude-field-from-filters-and-sortings)
- [Pagination](#pagination)
      - [@Query with pagination](#query-with-pagination)
- [Field extraction](#field-extraction)
      - [Basic example](#basic-example-1)
- [Base models and inheritance](#base-models-and-inheritance)
      - [How to inherit DTO from base class](#how-to-inherit-dto-from-base-class)
- [Federation](#federation)
      - [Example](#example-1)
- [Additional options](#additional-options)
- [More examples](#more-examples)
- [FAQ](#faq)
- [Contribution](#contribution)
- [License](#license)

## Installation

```bash
npm i nestjs-graphql-tools
or
yarn add nestjs-graphql-tools
```

## Data Loader n+1 problem solver
#### Loader usage guide
  1. Decorate your resolver with `@GraphqlLoader()`
  2. Add `@Loader()` parameter as a first parameter
  3. @Loader will return you LoaderData interface which includes ids of entities and helpers for constructing sutable object for graphql

##### One to many example

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

##### Many to one relation
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
## Polymorphic relations
`@GraphqlLoader` decorator provides ability to preload polymorphic relations
#### Usage
To be able to use it you need to decorate your resolver with `@GraphqlLoader` decorator. Decorator has parameter which allows to specify fields which needs to be gathered for polymorphic relation.

```typescript
@GraphqlLoader({
  polymorphic: {
    idField: 'description_id', // Name of polymorphic id attribute of the parent model
    typeField: 'description_type' // Name of polymorphic type attribute of the parent model
  }
})
```
This decorator will aggregate all types and provide ids for each type. All aggregated types will be aveilable in `@Loader` decorator. It has attribute which called `polymorphicTypes. 

PolmorphicTypes attribute shape 
```typescript
[
  {
    type: string | number
    ids: string[] | number[]
  }
]

```

##### Example

```typescript
// Parent class
// task.resolver.ts
@Resolver(() => TaskObjectType)
export class TaskResolver {
  constructor(
    @InjectRepository(Task) public readonly taskRepository: Repository<Task>,
    @InjectRepository(Description) public readonly descriptionRepository: Repository<Description>
  ) {}

  @ResolveField(() => [DescriptionObjectType])
  @GraphqlLoader()
  async descriptions(
    @Loader() loader: LoaderData<TaskObjectType, number>,
    @SelectedUnionTypes({ 
      nestedPolymorphicResolverName: 'descriptionable',
    }) selectedUnions: SelectedUnionTypesResult // <-- This decorator will gather and provide selected union types. NestedPolymorphicResolverName argument allows to specify where specifically it should gather the fields
  ) {
    // Mapping graphql types to the database types
    const selectedTypes = Array.from(selectedUnions.types.keys()).map(type => { 
      switch (type) {
        case DescriptionTextObjectType.name:
          return DescriptionType.Text;
        case DescriptionChecklistObjectType.name:
          return DescriptionType.Checklist;
      }
    });

    const qb = this.descriptionRepository.createQueryBuilder('d')
      .andWhere({
        task_id: In(loader.ids),
        description_type: In(selectedTypes) // finding only selected types
      })
    
    const descriptions = await qb.getMany();
    return loader.helpers.mapOneToManyRelation(descriptions, loader.ids, 'task_id');
  }
}


// Polymorphic resolver
// description.resolver.ts
@Resolver(() => DescriptionObjectType)
export class DescriptionResolver {
  constructor(
    @InjectRepository(DescriptionText) public readonly descriptionTextRepository: Repository<DescriptionText>,
    @InjectRepository(DescriptionChecklist) public readonly descriptionChecklistRepository: Repository<DescriptionChecklist>,
  ) {}
  
  @ResolveField(() => [DescriptionableUnion], { nullable: true })
  @GraphqlLoader({ // <-- We will load description_id field of parent model to the ids and description_type field to the type
    polymorphic: {
      idField: 'description_id',
      typeField: 'description_type'
    }
  })
  async descriptionable(
    @Loader() loader: PolymorphicLoaderData<[DescriptionText | DescriptionChecklist], number, DescriptionType>, // <-- It will return aggregated polymorphicTypes
    @SelectedUnionTypes() types: SelectedUnionTypesResult // <-- It will extract from the query and return selected union types
  ) {
    const results = []; // <-- We need to gather all entities to the single array

    for (const item of loader.polimorphicTypes) {
      switch(item.descriminator) {
        case DescriptionType.Text:
          const textDescriptions = await this.descriptionTextRepository.createQueryBuilder()
          .select(types.getFields(DescriptionTextObjectType))
          .where({
            id: In(item.ids)
          })
          .getRawMany();

          results.push({ descriminator: DescriptionType.Text, entities: textDescriptions })

          break;
        case DescriptionType.Checklist:
          const checklistDescriptions = await this.descriptionChecklistRepository.createQueryBuilder()
          .select(types.getFields(DescriptionChecklistObjectType))
          .where({
            id: In(item.ids)
          })
          .getRawMany();

          results.push({ descriminator: DescriptionType.Checklist, entities: checklistDescriptions })
          
          break;
        default: break;
      }
    }
    return loader.helpers.mapOneToManyPolymorphicRelation(results, loader.ids); // <-- This helper will change shape of responce to the shape which is sutable for graphql
  }
}
```
You can find complete example in src/descriptions folder


## Filters
Filter is giving ability to filter out entities by the condition. Condition looks similar to hasura interface using operators `eq, neq, gt, gte, lt, lte, in, like, notlike, between, notbetween, null`.
By default it generates filter based on provided model. It supports only first level of the tables hierachy. If you need to search in depth you can declare custom filters (example 3).

##### Basic example 1

```graphql
{
  users(where: {id: {eq: 1}}) {
    id
  }
}
```
##### Basic example 2
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
1. Add `@Filter()` parameter with type of `FilterArgs`
2. `@Filter()` will return typeorm compatible condition which you can use in your query builder.

##### @Query with filters

```typescript
@Resolver(() => UserObjectType)
export class UserResolver {
  constructor(
    @InjectRepository(Task) public readonly taskRepository: Repository<Task>,
    @InjectRepository(User) public readonly userRepository: Repository<User>
  ) {}

  @Query(() => [UserObjectType])
  users(
    @Filter(() => UserObjectType) filter: FilterArgs, // It will return  typeorm condition
    @Args('task_title', {nullable: true}) taskTitle: string, // You can add custom additional filter if needed
  ) {
    const qb = this.userRepository.createQueryBuilder('u')
      .leftJoin('task', 't', 't.assignee_id = u.id')
      .where(filter)
      .distinct();

      if (taskTitle) { // mixed filters
        qb.andWhere(`t.title ilike :title`, { title: `%${taskTitle}%` })
      }

    return qb.getMany()
  }
}
```

##### @ResolveField with filter

```typescript
@Resolver(() => UserObjectType)
export class UserResolver {
  constructor(@InjectRepository(Task) public readonly taskRepository: Repository<Task>) {}

  @ResolveField(() => TaskObjectType)
  @GraphqlLoader()
  async tasks(
    @Loader() loader: LoaderData<TaskObjectType, number>,
    @Filter(() => TaskObjectType) filter: FilterArgs,
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
##### Custom filters

```typescript
export class UserFilterInputType {
  @FilterField(() => String, { sqlExp: 't.title'})
  task_title: string;

  @FilterField(() => String, { sqlExp: 't.story_points'})
  task_story_points: number;
  
  @FilterField(() => String, { sqlExp: 'concat(u.fname, \' \', u.lname)'})
  full_name: string;
}

// Resolver
@Resolver(() => UserObjectType)
export class UserResolver {
  constructor(
    @InjectRepository(Task) public readonly taskRepository: Repository<Task>,
    @InjectRepository(StoryModel) public readonly storyRepository: Repository<StoryModel>,
    @InjectRepository(User) public readonly userRepository: Repository<User>
  ) {}

  @Query(() => [UserObjectType])
  users(
    @Filter(() => [UserObjectType, UserFilterInputType]) filter: FilterArgs, // <-- Object model and Filter model. It is possible to provide only one model or more that 2.
    @Sorting(() => UserObjectType, { sqlAlias: 'u' }) sorting: SortArgs<UserObjectType>
  ) {
    const qb = this.userRepository.createQueryBuilder('u')
      .leftJoin('task', 't', 't.assignee_id = u.id')
      .where(filter)
      .orderBy(sorting);

    return qb.getMany()
  }
}
```

You can also exclude some fields from the DTO filter. Read [Exclusions](#exclusions).


## Sorting
The library provides ability to make sorting. It supports all types of sorting.
`[ASC/DESC] [NULLS FIRST/LAST]`

##### Basic example

```graphql
{
  users(
    order_by: {
      id: ASC_NULLS_LAST
    }
  ) {
    id
  }
}
```
```typescript
@Resolver(() => TaskObjectType)
export class TaskResolver {
  constructor(@InjectRepository(Task) public readonly taskRepository: Repository<Task>) {}

  @Query(() => [TaskObjectType])
  async tasks(
    /* SqlAlias is an ptional argument. Allows to provide alias in case if you have many tables joined. In current case it doesn't required */
    @Sorting(() => TaskObjectType, { sqlAlias: 't' }) sorting: SortArgs<TaskObjectType>
  ) {
    const qb = this.taskRepository.createQueryBuilder('t')
      .orderBy(sorting);
    return qb.getMany();
  }
}
```

##### Custom sorting fields
```typescript
// sorting.dto.ts
export class UserSortingInputType {
  @SortingField({sqlExp: 't.story_points'})
  task_story_points: number;
}

// user.resolver.ts
@Resolver(() => UserObjectType)
export class UserResolver {
  constructor(
    @InjectRepository(Task) public readonly taskRepository: Repository<Task>,
    @InjectRepository(StoryModel) public readonly storyRepository: Repository<StoryModel>,
    @InjectRepository(User) public readonly userRepository: Repository<User>
  ) {}

  @Query(() => [UserObjectType])
  users(
    /* SqlAlias is an optional argument. You can provide alias in case if you have many tables joined.
    Object model and Sorting model. Ability to provide 1+ model. It accepts both Object and Sorting models. Next model in array extends previous model overriding fields with the same names.
    */
    @Sorting(() => [UserObjectType, UserSortingInputType], { sqlAlias: 'u' }) sorting: SortArgs<UserObjectType>
  ) {
    const qb = this.userRepository.createQueryBuilder('u')
      .leftJoin('task', 't', 't.assignee_id = u.id')
      .orderBy(sorting)
      .distinct();

    return qb.getMany()
  }
}
```
You can also exclude some fields from the sorting DTO. Read [Exclusions](#exclusions).

## Exclusions
Sometimes you don't want to provide filters/sorting by all the fields in the dto. There's a couple decorators that can help with it `@FilterField({exclude: true}) ` and `@SortingField({exclude: true})`

##### Exclude field from filters and sortings
```typescript

@ObjectType()
export class User {
  @Field(() => String)
  fname: string;

  @Field(() => String)
  @FilterField({exclude: true})
  @SortingField({exclude: true})
  mname: string;

  @Field(() => String)
  lname: string;
}

export class UserResolver {
  @Query(() => [UserObjectType])
  users(
    @Filter(() => [UserObjectType], {sqlAlias: 'u'}) filter: FilterArgs,
    @Sorting(() => [UserObjectType], { sqlAlias: 'u' }) sorting: SortArgs<UserObjectType>
  ) {
    const qb = this.userRepository.createQueryBuilder('u')
      .where(filter)
      .orderBy(sorting);

    return qb.getMany()
  }
}

```

Now, if you try to build a query with the sorting an filtering by mname you'll get an error, because there's not such field in the graphql schema definition for sorting and filtering.

## Pagination
The library provides parameter decorator `@Paginator()` for the pagination. This decorator returns object like that

```typescript
{
  page: number,
  per_page: number
}

```

##### @Query with pagination

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
      qb.offset(paginator.page * paginator.per_page).limit(paginator.per_page)
    }

    return qb.getMany();
  }
}
```

## Field extraction
The library allows to gather only requested field from the query and provides it as an array to the parameter variable.

##### Basic example

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
  async tasks(
   @Filter(() => TaskObjectType) filter: FilterArgs,
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

## Base models and inheritance
In order to make base model with common attributes it is required to decorate base model with the `@InheritedModel()` decorator. You can find usage of it in base.dto.ts file inside src folder.

##### How to inherit DTO from base class
```typescript
@ObjectType()
@InheritedModel() // <-- Make inheritance possible. If you not decorate object with this decorator, you will not see these properties in "where" and sorting statements
export class BaseDTO {
  @Field(() => Int)
  id: number;

  // Timestamps
  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;
}
```

## Federation
Basic support of federation already in place. Just add to your method with `@ResolveReference()` one more decorator `@GraphqlLoader()`

##### Example
This examples is the reference to official example https://github.com/nestjs/nest/tree/master/sample/31-graphql-federation-code-first. Clone https://github.com/nestjs/nest/tree/master/sample/31-graphql-federation-code-first (download specific directory with https://download-directory.github.io/ or with chrome extention https://chrome.google.com/webstore/detail/gitzip-for-github/ffabmkklhbepgcgfonabamgnfafbdlkn)
1. Annotate method resolveReference of `users-application/src/users/users.resolver.ts`
```typescript
// users-application/src/users/users.resolver.ts
@ResolveReference()
@GraphqlLoader()
async resolveReference(
   @Loader() loader: LoaderData<User, number>,
) {
 const ids = loader.ids;
 const users = this.usersService.findByIds(ids);
 return loader.helpers.mapManyToOneRelation(users, loader.ids, 'id')
}
```
1. Add method findByIds to `users-application/src/users/users.service.ts`
```typescript
// users-application/src/users/users.service.ts
@Injectable()
export class UsersService {
  private users: User[] = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Richard Roe' },
  ];

  findByIds(idsList: number[]): User[] {
    return this.users.filter((user) => idsList.some(id => Number(id) === user.id));
  }
}
```
3. Install dependencies of 3 projects : npm ci in gateway, posts-application, users-application.
4. Run all projects in order :
   - `cd users-application && npm run start`
   - `cd posts-application && npm run start`
   - `cd gateway && npm run start`

5. Go to localhost:3001/graphql and send graphql request to gateway
```graphql
{
  posts {
    id
    title
    authorId
    user {
      id
      name
    }
  }
}
```
## Additional options
Options are ENV variables that you can provide to configurate the lib
- `FILTER_OPERATION_PREFIX` - Operation prefix. You can make hasura-like prefix for where operators like _eq, _neq, etc. Example `FILTER_OPERATION_PREFIX=\_`


## More examples
You can find more examples in the src folder

## FAQ
1. **Q**: Let's say you have many joins and some tables has duplicated fields like name or title. **A**: In order not to break filters you need to provide sqlAlias that matches alias of the main model of the query. There plenty examples in the code in in readme.
2. **Q**:The same example where you have a model with many joins and you want to provide ability to sort or filter by joined field. **A**: you can create custom filter with ability to provide sql alias that they will use. Check out filtering section, there a couple examples with custom fields.
3. **Q**: The error: `QueryFailedError: for SELECT DISTINCT, ORDER BY expressions must appear in select list`. **A** To avoid this error add sorted field to selected fields. In most of the time it might happen in case you're using custom fields for sorting.


## Contribution
If you want to contribute please create new PR with good description.

How to run the project:
1. Create a database
```bash
createdb -h localhost -U postgres nestjs_graphql_tools_development_public;
```
2. Fill out database config in `config/default.json`
3. Run dev server
```bash
npm i
npm run start:dev
```
On the first run, server will seed up the database with testing dataset.

4. Reach out `http://localhost:3000/graphql`

## License

NestJS Graphql tools is [GNU GPLv3 licensed](LICENSE).
