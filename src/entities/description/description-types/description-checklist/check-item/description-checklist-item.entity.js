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
exports.DescriptionChecklistItem = void 0;
const typeorm_1 = require("typeorm");
const base_entity_1 = require("../../../../utils/base.entity");
const description_checklist_entity_1 = require("../description-checklist.entity");
let DescriptionChecklistItem = class DescriptionChecklistItem extends base_entity_1.Base {
};
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DescriptionChecklistItem.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DescriptionChecklistItem.prototype, "is_checked", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], DescriptionChecklistItem.prototype, "description_checklist_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => description_checklist_entity_1.DescriptionChecklist, (checklist) => checklist.items),
    (0, typeorm_1.JoinColumn)({ name: 'description_checklist_id' }),
    __metadata("design:type", description_checklist_entity_1.DescriptionChecklist)
], DescriptionChecklistItem.prototype, "checklist", void 0);
DescriptionChecklistItem = __decorate([
    (0, typeorm_1.Entity)('description_checklist_item')
], DescriptionChecklistItem);
exports.DescriptionChecklistItem = DescriptionChecklistItem;
//# sourceMappingURL=description-checklist-item.entity.js.map