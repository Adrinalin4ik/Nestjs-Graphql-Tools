import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../task/task.entity';
import { User } from '../user/user.entity';
import { StoryModel } from './story.entity';
import { StoryResolver } from './story.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User, StoryModel])],
  providers: [StoryResolver],
  controllers: [],
})
export class StoryModule {}
