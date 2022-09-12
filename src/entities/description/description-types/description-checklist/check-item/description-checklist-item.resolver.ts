import { Resolver } from '@nestjs/graphql';
import { DescriptionChecklistItemObjectType } from './description-checklist-item.dto';

@Resolver(() => DescriptionChecklistItemObjectType)
export class DescriptionChecklistItemResolver {}