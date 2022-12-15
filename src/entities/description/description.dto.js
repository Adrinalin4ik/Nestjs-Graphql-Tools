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
exports.DescriptionableUnion = exports.DescriptionObjectType = exports.DescriptionType = void 0;
const graphql_1 = require("@nestjs/graphql");
const base_dto_1 = require("../utils/base.dto");
const description_checklist_dto_1 = require("./description-types/description-checklist/description-checklist.dto");
const description_text_dto_1 = require("./description-types/description-text/description-text.dto");
var DescriptionType;
(function (DescriptionType) {
    DescriptionType["Text"] = "Text";
    DescriptionType["Checklist"] = "Checklist";
})(DescriptionType = exports.DescriptionType || (exports.DescriptionType = {}));
(0, graphql_1.registerEnumType)(DescriptionType, {
    name: 'DescriptionType',
});
let DescriptionObjectType = class DescriptionObjectType extends base_dto_1.BaseDTO {
};
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], DescriptionObjectType.prototype, "description_id", void 0);
__decorate([
    (0, graphql_1.Field)(() => DescriptionType),
    __metadata("design:type", String)
], DescriptionObjectType.prototype, "description_type", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Int),
    __metadata("design:type", Number)
], DescriptionObjectType.prototype, "task_id", void 0);
DescriptionObjectType = __decorate([
    (0, graphql_1.ObjectType)()
], DescriptionObjectType);
exports.DescriptionObjectType = DescriptionObjectType;
exports.DescriptionableUnion = (0, graphql_1.createUnionType)({
    name: 'DescriptionableUnion',
    types: () => [description_text_dto_1.DescriptionTextObjectType, description_checklist_dto_1.DescriptionChecklistObjectType],
    resolveType(value) {
        if (value['__UnionDescriminator__'] === DescriptionType.Text) {
            return description_text_dto_1.DescriptionTextObjectType;
        }
        else {
            return description_checklist_dto_1.DescriptionChecklistObjectType;
        }
    },
});
//# sourceMappingURL=description.dto.js.map