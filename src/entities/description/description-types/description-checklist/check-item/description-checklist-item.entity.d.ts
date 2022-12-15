import { Base } from '../../../../utils/base.entity';
import { DescriptionChecklist } from '../description-checklist.entity';
export declare class DescriptionChecklistItem extends Base {
    label: string;
    is_checked: boolean;
    description_checklist_id: number;
    checklist: DescriptionChecklist;
}
