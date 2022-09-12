import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne
} from 'typeorm';
import { Base } from '../../../../utils/base.entity';
import { DescriptionChecklist } from '../description-checklist.entity';

@Entity('description_checklist_item')
export class DescriptionChecklistItem extends Base {
  @Index()
  @Column()
  label: string;

  @Index()
  @Column({default: false})
  is_checked: boolean;

  @Index()
  @Column()
  description_checklist_id: number;
  
  @ManyToOne(() => DescriptionChecklist, (checklist) => checklist.items)
  @JoinColumn({name: 'description_checklist_id'})
  checklist: DescriptionChecklist;
}