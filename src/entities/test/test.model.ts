import { Field, InputType, ObjectType, registerEnumType } from "@nestjs/graphql";
import { FilterField, SortingField } from "../../../lib";
import { BaseDTO } from "../utils/base.dto";
import { ETest } from "./enum";

@ObjectType()
export class TestModel extends BaseDTO {
  @Field(() => String)
  str: string;
}

@InputType()
export class TestFilterInputType {
  @FilterField(() => ETest)
  test: ETest
}


@InputType()
export class TestSortingInputType {
  @SortingField()
  test: ETest
}