import { Resolver } from '@nestjs/graphql';
import { DescriptionTextObjectType } from './description-text.dto';

@Resolver(() => DescriptionTextObjectType)
export class DescriptionTextResolver {}