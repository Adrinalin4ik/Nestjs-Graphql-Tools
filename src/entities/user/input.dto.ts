import { Field, InputType, Int, PartialType } from "@nestjs/graphql";

@InputType()
export class CreateUserInputType {
  @Field(() => Int, { nullable: true })
  identification_number: number;

  @Field()
  email: string;

  @Field()
  fname: string;

  @Field()
  lname: string;

  @Field({ nullable: true })
  mname: string;

  @Field({ nullable: true })
  age: number;

  @Field(() => String, { nullable: true })
  phone: string;

  @Field({ nullable: true })
  is_active: boolean;
}

@InputType()
export class UpdateUserInputType extends PartialType(CreateUserInputType) {
  @Field(() => Int)
  id: number;
}