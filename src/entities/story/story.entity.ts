import { Field, GraphQLISODateTime, Int, ObjectType } from '@nestjs/graphql';
import {
  Column, CreateDateColumn, Entity, JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { User } from '../user/user.entity';

@ObjectType()
@Entity('story')
export class StoryModel {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;
  
  @Field(() => String)
  @Column({ nullable: true })
  title: string;
  
  @Field(() => String)
  @Column({ nullable: true })
  description: string;
  
  @Field(() => Int)
  @Column({ nullable: true })
  assignee_id: number;
  
  @ManyToOne(() => User, (user) => user.tasks, { nullable: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee: User;
  
  // Timestamps
  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  created_at: Date;
  
  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updated_at: Date;
}
