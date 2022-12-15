import { Base } from '../../../utils/base.entity';
import { DescriptionChecklistItem } from './check-item/description-checklist-item.entity';
export declare class DescriptionChecklist extends Base {
    title: string;
    items: DescriptionChecklistItem[];
}
