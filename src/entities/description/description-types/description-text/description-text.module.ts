import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DescriptionChecklist } from '../description-checklist/description-checklist.entity';
import { DescriptionChecklistModule } from '../description-checklist/description-checklist.module';
import { DescriptionText } from './description-text.entity';
import { DescriptionTextResolver } from './description-text.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([DescriptionText, DescriptionChecklist, DescriptionText]), 
    DescriptionChecklistModule, 
    DescriptionTextModule
  ],
  providers: [DescriptionTextResolver],
  controllers: [],
})
export class DescriptionTextModule {}
