import {
  Column,
  Entity,
  Index, OneToMany
} from 'typeorm';
import { Task } from '../task/task.entity';
import { Base } from '../utils/base.entity';

@Entity('user')
export class User extends Base {
  @Index()
  @Column({ nullable: true })
  identification_number: number;

  @Index()
  @Column()
  email: string;

  @Column()
  fname: string;

  @Column()
  lname: string;

  @Column({ nullable: true })
  mname: string;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  is_active: boolean;
  
  @OneToMany(() => Task, (task) => task.assignee)
  tasks: Task[];
}