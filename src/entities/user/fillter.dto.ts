import { Int } from "@nestjs/graphql";
import { FilterField } from "../../../lib";

export class UserFilterInputType {
  @FilterField(() => String, { sqlExp: 't.story_points'})
  task_story_points: number;
  
  @FilterField(() => String, { sqlExp: 'concat(u.fname, \' \', u.lname)'})
  full_name: string;

  @FilterField(() => String, { sqlExp: 't.title'})
  // @FilterField({exclude: true})
  task_title: string;
}

export class TaskFilterInputType {
  @FilterField(() => Int, { sqlExp: 't.id' })
  id: number;

  @FilterField(() => String, { sqlExp: 'concat(u.fname, \' \', u.lname)' })
  user_full_name: string;
}