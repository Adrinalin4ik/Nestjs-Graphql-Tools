// import { Filter } from '@nestjs-query/core';
import { Query, Resolver } from '@nestjs/graphql';
import { StoryModel } from './story.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filter, FilterArgs } from '../../../lib';

@Resolver(() => StoryModel)
export class StoryResolver {

  constructor(@InjectRepository(StoryModel) public readonly storyRepository: Repository<StoryModel>,) {

  }

  @Query(() =>[StoryModel])
  async stories(
    @Filter(() => StoryModel) filter: FilterArgs,
  ) {
    return this.storyRepository.createQueryBuilder().where(filter).getMany();
  }
}
