import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserObjectType } from '../user/user.dto';

@ObjectType()
export class TaskObjectType {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  title: string;

  @Field(() => Int)
  type_id: number;

  @Field(() => Int)
  priority: number;

  @Field(() => Int)
  story_points: number;

  @Field(() => Int)
  status: number;
  
  @Field(() => Int, {nullable: true})
  assignee_id: number;
  
  @Field(() => UserObjectType, {nullable: true})
  assignee: UserObjectType;

  @Field(() => Int)
  task_id: number;
  @Field(() => String)
  created_at: Date;

  @Field(() => String)
  updated_at: Date;
}
