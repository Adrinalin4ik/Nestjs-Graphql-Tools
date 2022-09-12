import { ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GraphqlLoader, Loader, LoaderData } from '../../../../../lib';
import { DescriptionChecklistItemObjectType } from './check-item/description-checklist-item.dto';
import { DescriptionChecklistItem } from './check-item/description-checklist-item.entity';
import { DescriptionChecklistObjectType } from './description-checklist.dto';

@Resolver(() => DescriptionChecklistObjectType)
export class DescriptionChecklistResolver {
  constructor(
    @InjectRepository(DescriptionChecklistItem) private readonly descriptionChecklistItemRepository: Repository<DescriptionChecklistItem>
  ) {}

  @ResolveField(() => [DescriptionChecklistItemObjectType])
  @GraphqlLoader()
  async items(
    @Loader() loader: LoaderData<DescriptionChecklistItemObjectType, number>
  ) {
    const qb = await this.descriptionChecklistItemRepository.createQueryBuilder('c')
      .where({
        description_checklist_id: In(loader.ids)
      })
      .getMany()

    return loader.helpers.mapOneToManyRelation(qb, loader.ids, 'description_checklist_id');
  }
}