import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Description } from '../description/description.entity';
import { DescriptionModule } from '../description/description.module';
import { User } from '../user/user.entity';
import { Task } from './task.entity';
import { TaskResolver } from './task.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Task, User, Description]), DescriptionModule],
  providers: [TaskResolver],
  controllers: [],
})
export class TaskModule {}
