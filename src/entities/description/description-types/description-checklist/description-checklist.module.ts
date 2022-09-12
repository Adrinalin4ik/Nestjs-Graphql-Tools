import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DescriptionChecklistItem } from './check-item/description-checklist-item.entity';
import { DescriptionChecklistItemModule } from './check-item/description-checklist-item.module';
import { DescriptionChecklist } from './description-checklist.entity';
import { DescriptionChecklistResolver } from './description-checklist.resolver';

@Module({
  imports: [
    TypeOrmModule.forFeature([DescriptionChecklist, DescriptionChecklistItem]), 
    DescriptionChecklistItemModule
  ],
  providers: [DescriptionChecklistResolver],
  controllers: [],
})
export class DescriptionChecklistModule {}
