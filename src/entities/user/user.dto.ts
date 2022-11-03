import { createUnionType, Field, Int, ObjectType } from "@nestjs/graphql";
import { StoryModel } from "../story/story.entity";
import { TaskObjectType } from "../task/task.dto";
import { Task } from "../task/task.entity";
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

@ObjectType()
export class UserAggregationType {
  @Field(() => Number)
  count?: number

  @Field(() => Number)
  identification_avg: number;
}

export const SearchTasksUnion = createUnionType({
  name: 'SearchTasks',
  types: () => [TaskObjectType, StoryModel] as const,
  resolveType(value) {
    if (value instanceof Task) {
      return TaskObjectType;
    } else {
      return StoryModel;
    }
  },
});