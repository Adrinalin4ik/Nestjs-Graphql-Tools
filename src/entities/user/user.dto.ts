import { Field, Int, ObjectType } from "@nestjs/graphql";
import { BaseDTO } from "../utils/base.dto";

@ObjectType()
export class UserObjectType extends BaseDTO {
  @Field(() => Int)
  identification_number: number;

  @Field()
  email: string;

  @Field()
  fname: string;

  @Field()
  lname: string;

  @Field()
  mname: string;

  @Field()
  age: number;

  @Field()
  phone: string;

  @Field()
  is_active: boolean;
}