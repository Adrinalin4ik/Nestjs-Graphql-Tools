import { createUnionType, Field, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import { FilterField, SortingField } from "../../../lib";
import { StoryModel } from "../story/story.entity";
import { TaskObjectType } from "../task/task.dto";
import { Task } from "../task/task.entity";
import { BaseDTO } from "../utils/base.dto";

export enum EGenderType {
  Male = 1,
  Female = 2,
}

registerEnumType(EGenderType, {
  name: 'EGenderType',
});

export enum ERole {
  Admin = 'Admin',
  User = 'User'
}

registerEnumType(ERole, {
  name: 'ERole',
});

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
  @FilterField({exclude: true})
  @SortingField({exclude: true})
  mname: string;

  @Field()
  age: number;

  @Field(() => String, { nullable: true })
  phone: string;

  @Field()
  is_active: boolean;

  @Field(() => EGenderType)
  gender: EGenderType;

  @Field(() => ERole)
  role: ERole;
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