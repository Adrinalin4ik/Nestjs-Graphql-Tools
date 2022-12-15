import { Task } from '../task/task.entity';
import { Base } from '../utils/base.entity';
export declare class User extends Base {
    identification_number: number;
    email: string;
    fname: string;
    lname: string;
    mname: string;
    age: number;
    phone: string;
    is_active: boolean;
    tasks: Task[];
}
