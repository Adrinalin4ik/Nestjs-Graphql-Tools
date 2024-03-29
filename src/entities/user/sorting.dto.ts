import { SortingField } from "../../../lib";

export class UserSortingInputType {
  @SortingField({sqlExp: 't.story_points'})
  // @SortingField({exclude: true})
  task_story_points: number;

  @SortingField({ sqlExp: 'u.fname || \' \' || u.lname'})
  full_name: string;
}

export class TaskSortingInputType {
  @SortingField({sqlExp: 't.id'})
  id: number;

  @SortingField({ sqlExp: 'u.fname || \' \' || u.lname' })
  user_full_name: string;
}