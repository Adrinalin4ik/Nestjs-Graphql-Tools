import {
  Column,
  Entity, Index, JoinColumn,
  ManyToOne
} from 'typeorm';
import { Task } from '../task/task.entity';
import { Base } from '../utils/base.entity';
import { DescriptionType } from './description.dto';

@Entity('description')
export class Description extends Base {
  // @Index()
  @Column({nullable: true})
  description_id: number;
  
  // @Index()
  @Column({type: String, nullable: true})
  description_type: DescriptionType;

  @Index()
  @Column()
  task_id: number;
  
  @ManyToOne(() => Task, (task) => task.descriptions)
  @JoinColumn({name: 'task_id'})
  task: Task;
}