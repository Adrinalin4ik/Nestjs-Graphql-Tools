import { Field, ObjectType } from "@nestjs/graphql";
import { BaseDTO } from "../../../../utils/base.dto";

@ObjectType()
export class DescriptionChecklistItemObjectType extends BaseDTO {
  @Field(() => String)
  label: string;

  @Field(() => String)
  is_checked: string;
}