import { Field, ObjectType } from "@nestjs/graphql";
import { BaseDTO } from "../../../utils/base.dto";

@ObjectType()
export class DescriptionTextObjectType extends BaseDTO {
  @Field(() => String)
  text: string;
}