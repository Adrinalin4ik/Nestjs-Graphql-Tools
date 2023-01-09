import { ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GraphqlLoader, Loader, PolymorphicLoaderData, SelectedUnionTypes, SelectedUnionTypesResult } from '../../../lib';
import { DescriptionChecklistObjectType } from './description-types/description-checklist/description-checklist.dto';
import { DescriptionChecklist } from './description-types/description-checklist/description-checklist.entity';
import { DescriptionTextObjectType } from './description-types/description-text/description-text.dto';
import { DescriptionText } from './description-types/description-text/description-text.entity';
import { DescriptionableUnion, DescriptionObjectType, DescriptionType } from './description.dto';

@Resolver(() => DescriptionObjectType)
export class DescriptionResolver {
  constructor(
    @InjectRepository(DescriptionText) public readonly descriptionTextRepository: Repository<DescriptionText>,
    @InjectRepository(DescriptionChecklist) public readonly descriptionChecklistRepository: Repository<DescriptionChecklist>,
  ) {}

  @ResolveField(() => [DescriptionableUnion], { nullable: true })
  @GraphqlLoader({
    polymorphic: (parent: DescriptionObjectType) => ({
      id: parent.description_id,
      descriminator: parent.description_type
    })
  })
  async descriptionable(
    @Loader() loader: PolymorphicLoaderData<[DescriptionText | DescriptionChecklist], number, DescriptionType>,
    @SelectedUnionTypes() types: SelectedUnionTypesResult
  ) {
    const results = [];

    for (const item of loader.polimorphicTypes) {
      switch(item.descriminator) {
        case DescriptionType.Text:
          const textDescriptions = await this.descriptionTextRepository.createQueryBuilder()
          .select(types.getFields(DescriptionTextObjectType))
          .where({
            id: In(item.ids)
          })
          .getRawMany();

          results.push({ descriminator: DescriptionType.Text, entities: textDescriptions })

          break;
        case DescriptionType.Checklist:
          const checklistDescriptions = await this.descriptionChecklistRepository.createQueryBuilder()
          .select(types.getFields(DescriptionChecklistObjectType))
          .where({
            id: In(item.ids)
          })
          .getRawMany();

          results.push({ descriminator: DescriptionType.Checklist, entities: checklistDescriptions })
          
          break;
        default: break;
      }
    }
    return loader.helpers.mapOneToManyPolymorphicRelation(results, loader.ids);
  }
}