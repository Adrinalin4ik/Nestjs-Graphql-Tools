import { ResolveField, Resolver } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GraphqlLoader, Loader, LoaderData } from '../../../lib';
import { DescriptionChecklist } from './description-types/description-checklist/description-checklist.entity';
import { DescriptionText } from './description-types/description-text/description-text.entity';
import { DescriptionableUnion, DescriptionObjectType, DescriptionType } from './description.dto';

@Resolver(() => DescriptionObjectType)
export class DescriptionResolver {
  constructor(
    @InjectRepository(DescriptionText) public readonly descriptionTextRepository: Repository<DescriptionText>,
    @InjectRepository(DescriptionChecklist) public readonly descriptionChecklistRepository: Repository<DescriptionChecklist>,
  //   @InjectRepository(User) public readonly userRepository: Repository<User>
  ) {}

  @ResolveField(() => [DescriptionableUnion])
  @GraphqlLoader({
    polymorphic: {
      idField: 'description_id',
      typeField: 'description_type'
    }
  })
  async descriptionable(
    @Loader() loader: LoaderData<[DescriptionText | DescriptionChecklist], {type: DescriptionType, ids: number[]}>,
  ) {

    const results = [];

    for (const item of loader.polimorphicTypes) {
      switch(item.type) {
        case DescriptionType.Text:
          const textDescriptions = await this.descriptionTextRepository.createQueryBuilder()
          .where({
            id: In(item.ids)
          })
          .getMany();

          results.push(
            ...textDescriptions
          )
          break;
        case DescriptionType.Checklist:
          const checklistDescriptions = await this.descriptionChecklistRepository.createQueryBuilder()
          .where({
            id: In(item.ids)
          })
          .getMany();

          results.push(
            ...checklistDescriptions
          )
          break;
        default: break;
      }
    }
    const res = loader.helpers.mapOneToManyRelation(results, loader.ids, 'id');

    return res;
  }
}