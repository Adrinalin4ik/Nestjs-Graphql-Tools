import { Field, ObjectType } from "@nestjs/graphql";
import { BaseDTO } from "../../../utils/base.dto";

@ObjectType()
export class DescriptionChecklistObjectType extends BaseDTO {
  @Field(() => String)
  title: string;
}