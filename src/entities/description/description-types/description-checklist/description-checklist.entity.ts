import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Base } from '../../../utils/base.entity';
import { DescriptionChecklistItem } from './check-item/description-checklist-item.entity';

@Entity('description_checklist')
export class DescriptionChecklist extends Base {
  @Index()
  @Column()
  title: string;

  @OneToMany(() => DescriptionChecklistItem, (item) => item.checklist)
  @JoinColumn()
  items: DescriptionChecklistItem[];
}