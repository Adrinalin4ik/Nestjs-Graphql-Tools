import {
  Column,
  Entity,
  Index
} from 'typeorm';
import { Base } from '../../../utils/base.entity';

@Entity('description_text')
export class DescriptionText extends Base {
  @Index()
  @Column()
  text: string;
}