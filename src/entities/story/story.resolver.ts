// import { Filter } from '@nestjs-query/core';
import { Resolver } from '@nestjs/graphql';
import { StoryModel } from './story.entity';

@Resolver(() => StoryModel)
export class StoryResolver {}
