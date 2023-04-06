import {
  Column,
  Entity,
  Index, OneToMany
} from 'typeorm';
import { Task } from '../task/task.entity';
import { Base } from '../utils/base.entity';
import { EGenderType, ERole } from './user.dto';

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

  @Column({ default: EGenderType.Male, enum: EGenderType, type: "enum",})
  gender: EGenderType;

  @Column({ default: ERole.User, enum: ERole, type: "enum",})
  role: ERole;

  @Column({ default: true })
  is_active: boolean;
  
  @OneToMany(() => Task, (task) => task.assignee)
  tasks: Task[];
}