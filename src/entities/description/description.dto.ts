import { createUnionType, Field, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import { BaseDTO } from "../utils/base.dto";
import { DescriptionChecklistObjectType } from "./description-types/description-checklist/description-checklist.dto";
import { DescriptionTextObjectType } from "./description-types/description-text/description-text.dto";
import { DescriptionText } from "./description-types/description-text/description-text.entity";

export enum DescriptionType {
  Text = 'Text',
  Checklist = 'Checklist'
}

registerEnumType(DescriptionType, {
  name: 'DescriptionType',
});

@ObjectType()
export class DescriptionObjectType extends BaseDTO {
  @Field(() => Int)
  description_id: number;

  @Field(() => DescriptionType)
  description_type: DescriptionType;

  @Field(() => Int)
  task_id: number;
}

export const DescriptionableUnion = createUnionType({
  name: 'DescriptionableUnion',
  types: () => [DescriptionTextObjectType, DescriptionChecklistObjectType] as const,
  resolveType(value) {
    if (value instanceof DescriptionText) {
      return DescriptionTextObjectType;
    } else {
      return DescriptionChecklistObjectType;
    }
  },
});