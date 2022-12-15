import { User } from '../user/user.entity';
import { Base } from '../utils/base.entity';
export declare class Task extends Base {
    title: string;
    description: string;
    type_id: number;
    priority: number;
    story_points: number;
    status: number;
    assignee_id: number;
    task_id: number;
    assignee: User;
    descriptions: User;
}
