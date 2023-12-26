import { Query } from "@nestjs/graphql";
import { TestFilterInputType, TestModel, TestSortingInputType } from "./test.model";
import { Filter, Sorting } from "../../../lib";

export class TestResolver {

  @Query(() => [TestModel])
  test(
    @Filter(() => [TestFilterInputType]) filter: any,
    @Sorting(() => [TestSortingInputType]) sorting: any
  ) {
    console.log(filter);
    console.log(sorting);
    return []
  }
} 