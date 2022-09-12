import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DescriptionChecklistItem } from './description-checklist-item.entity';
import { DescriptionChecklistItemResolver } from './description-checklist-item.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([DescriptionChecklistItem])],
  providers: [DescriptionChecklistItemResolver],
  controllers: [],
})
export class DescriptionChecklistItemModule {}
