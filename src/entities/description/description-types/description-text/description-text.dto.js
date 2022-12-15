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
exports.DescriptionTextObjectType = void 0;
const graphql_1 = require("@nestjs/graphql");
const base_dto_1 = require("../../../utils/base.dto");
let DescriptionTextObjectType = class DescriptionTextObjectType extends base_dto_1.BaseDTO {
};
__decorate([
    (0, graphql_1.Field)(() => String),
    __metadata("design:type", String)
], DescriptionTextObjectType.prototype, "text", void 0);
DescriptionTextObjectType = __decorate([
    (0, graphql_1.ObjectType)()
], DescriptionTextObjectType);
exports.DescriptionTextObjectType = DescriptionTextObjectType;
//# sourceMappingURL=description-text.dto.js.map