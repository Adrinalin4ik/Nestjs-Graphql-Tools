"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescriptionChecklist = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../utils/base.entity");
const description_checklist_item_entity_1 = require("./check-item/description-checklist-item.entity");
let DescriptionChecklist = class DescriptionChecklist extends base_entity_1.Base {
};
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DescriptionChecklist.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => description_checklist_item_entity_1.DescriptionChecklistItem, (item) => item.checklist),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", Array)
], DescriptionChecklist.prototype, "items", void 0);
DescriptionChecklist = __decorate([
    (0, typeorm_1.Entity)('description_checklist')
], DescriptionChecklist);
exports.DescriptionChecklist = DescriptionChecklist;
//# sourceMappingURL=description-checklist.entity.js.map