import { Task } from '../task/task.entity';
import { Base } from '../utils/base.entity';
import { DescriptionType } from './description.dto';
export declare class Description extends Base {
    description_id: number;
    description_type: DescriptionType;
    task_id: number;
    task: Task;
}
