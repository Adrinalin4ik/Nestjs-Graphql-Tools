import {
  Column, Entity,
  Index,
  JoinColumn,
  ManyToOne
} from 'typeorm';
import { User } from '../user/user.entity';
import { Base } from '../utils/base.entity';

@Entity('task')
export class Task extends Base {
  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  type_id: number;

  @Column({ nullable: true })
  priority: number;

  @Column({ nullable: true })
  story_points: number;

  @Column({ nullable: true })
  status: number;

  @Column({ nullable: true })
  assignee_id: number;

  @Column({ nullable: true })
  @Index()
  task_id: number;
  
  @ManyToOne(() => User, (user) => user.tasks, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;
}
