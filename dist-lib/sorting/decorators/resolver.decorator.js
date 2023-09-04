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
exports.SortingPipe = exports.Sorting = exports.GraphqlSorting = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const functions_1 = require("../../utils/functions");
const constants_1 = require("../constants");
const input_type_generator_1 = require("../input-type-generator");
const query_builder_1 = require("../query.builder");
const GraphqlSorting = () => {
    return (target, property, descriptor) => {
    };
};
exports.GraphqlSorting = GraphqlSorting;
const Sorting = (baseEntity, options) => {
    return (target, propertyName, paramIndex) => {
        const name = `${(0, functions_1.standardize)(target.constructor.name)}_${(0, functions_1.standardize)(propertyName)}`;
        const extractedResults = baseEntity();
        let typeFunctions = extractedResults;
        if (!Array.isArray(extractedResults)) {
            typeFunctions = [extractedResults];
        }
        const sortingFullType = (0, input_type_generator_1.getSortingFullInputType)(typeFunctions, name);
        const customFields = typeFunctions.reduce((acc, typeFn) => {
            const customSortingData = Reflect.getMetadata(constants_1.SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, typeFn.prototype);
            if (customSortingData) {
                for (const field of customSortingData.fields.values()) {
                    acc.set(field.name, field);
                }
            }
            return acc;
        }, new Map());
        Reflect.defineMetadata(constants_1.SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, customFields, target, propertyName);
        (0, graphql_1.Args)({
            name: (options === null || options === void 0 ? void 0 : options.name) || 'order_by',
            nullable: true,
            type: () => [sortingFullType],
        }, new SortingPipe({
            options,
            customFields
        }))(target, propertyName, paramIndex);
    };
};
exports.Sorting = Sorting;
let SortingPipe = class SortingPipe {
    constructor(args) {
        this.args = args;
    }
    transform(value, _metadata) {
        return (0, query_builder_1.convertSortingParameters)(value, this.args.customFields, this.args.options);
    }
};
SortingPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], SortingPipe);
exports.SortingPipe = SortingPipe;
//# sourceMappingURL=resolver.decorator.js.map