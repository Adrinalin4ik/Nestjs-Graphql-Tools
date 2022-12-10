import { Int } from "@nestjs/graphql";
import { FilterField, FilterInputType } from "../../../lib/filters/filter.input-type";

@FilterInputType()
export class UserFilterInputType {
  @FilterField(() => String, { sqlExp: 't.title'})
  task_title: string;

  @FilterField(() => String, { sqlExp: 't.story_points'})
  task_story_points: number;
  
  @FilterField(() => String, { sqlExp: 'concat(u.fname, \' \', u.lname)'})
  full_name: string;
}

@FilterInputType()
export class TaskFilterInputType {
  @FilterField(() => Int)
  id: number;

  @FilterField(() => String, { sqlExp: 'concat(u.fname, \' \', u.lname)' })
  user_full_name: string;
}