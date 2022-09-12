import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '../task/task.entity';
import { DescriptionChecklist } from './description-types/description-checklist/description-checklist.entity';
import { DescriptionChecklistModule } from './description-types/description-checklist/description-checklist.module';
import { DescriptionText } from './description-types/description-text/description-text.entity';
import { DescriptionTextModule } from './description-types/description-text/description-text.module';
import { DescriptionResolver } from './description.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Task, DescriptionText, DescriptionChecklist]), DescriptionTextModule, DescriptionChecklistModule],
  providers: [DescriptionResolver],
  controllers: [],
})
export class DescriptionModule {}
