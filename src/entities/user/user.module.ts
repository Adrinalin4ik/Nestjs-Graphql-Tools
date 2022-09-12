import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoryModel } from '../story/story.entity';
import { Task } from '../task/task.entity';
import { User } from './user.entity';
import { UserResolver } from './user.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([User, Task, StoryModel])],
  providers: [UserResolver],
  controllers: [],
})
export class UserModule {}
