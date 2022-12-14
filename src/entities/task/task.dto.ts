import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class TaskObjectType {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  title: string;

  @Field(() => Int, {nullable: true})
  type_id: number;

  @Field(() => Int, {nullable: true})
  priority: number;

  @Field(() => Int, {nullable: true})
  story_points: number;

  @Field(() => Int, {nullable: true})
  status: number;
  
  @Field(() => Int, {nullable: true})
  assignee_id: number;

  @Field(() => Int)
  task_id: number;
  
  @Field(() => String)
  created_at: Date;

  @Field(() => String)
  updated_at: Date;
}
