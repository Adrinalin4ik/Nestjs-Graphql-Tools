// import { Filter } from '@nestjs-query/core';
import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { Filter, GraphqlFilter, GraphqlLoader, GraphqlSorting, Loader, LoaderData, Paginator, PaginatorArgs, SelectedFields, SelectedFieldsResult, SelectedUnionTypes, SelectedUnionTypesResult, SortArgs, Sorting } from '../../../lib';
import { DescriptionChecklistObjectType } from '../description/description-types/description-checklist/description-checklist.dto';
import { DescriptionTextObjectType } from '../description/description-types/description-text/description-text.dto';
import { DescriptionObjectType, DescriptionType } from '../description/description.dto';
import { Description } from '../description/description.entity';
import { UserObjectType } from '../user/user.dto';
import { User } from '../user/user.entity';
import { TaskObjectType } from './task.dto';
import { Task } from './task.entity';

@Resolver(() => TaskObjectType)
export class TaskResolver {

  constructor(
    @InjectRepository(Task) public readonly taskRepository: Repository<Task>,
    @InjectRepository(User) public readonly userRepository: Repository<User>,
    @InjectRepository(Description) public readonly descriptionRepository: Repository<Description>
  ) {}

  @Query(() => [TaskObjectType])
  @GraphqlFilter()
  @GraphqlSorting()
  async tasks(
   @Filter(() => TaskObjectType) filter: Brackets,
   @SelectedFields({sqlAlias: 't'}) selectedFields: SelectedFieldsResult,
   @Paginator() paginator: PaginatorArgs,
   @Sorting(() => TaskObjectType) sorting: SortArgs<TaskObjectType>
  ) {
    const qb = this.taskRepository.createQueryBuilder('t')
      .select(selectedFields.fieldsData.fieldsString)
      .where(filter)
    
    if (paginator) {
      qb.offset(paginator.page * paginator.per_page).limit(paginator.per_page)
    }
    
    if (sorting) {
      qb.orderBy(sorting);
    }
    return qb.getMany();
  }

  @ResolveField(() => UserObjectType, {nullable: true})
  @GraphqlLoader({
    foreignKey: 'assignee_id'
  })
  async assignee(
    @Loader() loader: LoaderData<TaskObjectType, number>,
    @Filter(() => UserObjectType) filter: Brackets,
  ) {
    const qb = this.userRepository.createQueryBuilder('u')
      .where(filter)
      .andWhere({
        id: In(loader.ids)
      })
    const users = await qb.getMany();
    return loader.helpers.mapManyToOneRelation(users, loader.ids);
  }

  @ResolveField(() => [DescriptionObjectType])
  @GraphqlLoader()
  async descriptions(
    @Loader() loader: LoaderData<TaskObjectType, number>,
    @SelectedUnionTypes({
      nestedPolymorphicResolverName: 'descriptionable',
    }) selectedUnions: SelectedUnionTypesResult
  ) {
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
        description_type: In(selectedTypes)
      })
    
    const descriptions = await qb.getMany();
    return loader.helpers.mapOneToManyRelation(descriptions, loader.ids, 'task_id');
  }
}
