import { BaseDTO } from "../utils/base.dto";
import { DescriptionChecklistObjectType } from "./description-types/description-checklist/description-checklist.dto";
import { DescriptionTextObjectType } from "./description-types/description-text/description-text.dto";
export declare enum DescriptionType {
    Text = "Text",
    Checklist = "Checklist"
}
export declare class DescriptionObjectType extends BaseDTO {
    description_id: number;
    description_type: DescriptionType;
    task_id: number;
}
export declare const DescriptionableUnion: DescriptionChecklistObjectType | DescriptionTextObjectType;
