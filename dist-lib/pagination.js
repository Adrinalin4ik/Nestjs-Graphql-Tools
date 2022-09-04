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
exports.Paginator = exports.PaginatorArgs = void 0;
const graphql_1 = require("@nestjs/graphql");
let PaginatorArgs = class PaginatorArgs {
};
__decorate([
    (0, graphql_1.Field)({ defaultValue: 10 }),
    __metadata("design:type", Number)
], PaginatorArgs.prototype, "per_page", void 0);
__decorate([
    (0, graphql_1.Field)({ defaultValue: 0 }),
    __metadata("design:type", Number)
], PaginatorArgs.prototype, "page", void 0);
PaginatorArgs = __decorate([
    (0, graphql_1.InputType)()
], PaginatorArgs);
exports.PaginatorArgs = PaginatorArgs;
const Paginator = (options) => {
    return (target, propertyName, paramIndex) => {
        (0, graphql_1.Args)({
            name: (options === null || options === void 0 ? void 0 : options.name) || 'paginate',
            nullable: (options === null || options === void 0 ? void 0 : options.nullable) !== undefined ? options.nullable : true,
            type: () => PaginatorArgs,
        })(target, propertyName, paramIndex);
    };
};
exports.Paginator = Paginator;
//# sourceMappingURL=pagination.js.map