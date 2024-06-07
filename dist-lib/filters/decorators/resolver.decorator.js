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
exports.FilterPipe = exports.Filter = exports.GraphqlFilter = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const functions_1 = require("../../utils/functions");
const constants_1 = require("../constants");
const input_type_generator_1 = require("../input-type-generator");
const query_builder_1 = require("../query.builder");
const GraphqlFilter = () => {
    return (target, property, descriptor) => {
    };
};
exports.GraphqlFilter = GraphqlFilter;
const Filter = (baseEntity, options) => {
    return (target, propertyName, paramIndex) => {
        const name = `${(0, functions_1.standardize)(target.constructor.name)}_${(0, functions_1.standardize)(propertyName)}`;
        const extractedResults = baseEntity();
        let typeFunctions = extractedResults;
        if (!Array.isArray(extractedResults)) {
            typeFunctions = [extractedResults];
        }
        const filterFullType = (0, input_type_generator_1.getFilterFullInputType)(typeFunctions, name);
        const customFields = typeFunctions.reduce((acc, typeFn) => {
            const customFilterData = Reflect.getMetadata(constants_1.FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, typeFn.prototype);
            if (customFilterData) {
                for (const field of customFilterData.fields.values()) {
                    acc.set(field.name, field);
                }
            }
            return acc;
        }, new Map());
        Reflect.defineMetadata(constants_1.FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, customFields, target, propertyName);
        const pipes = [];
        if (!(options === null || options === void 0 ? void 0 : options.raw)) {
            pipes.push(new FilterPipe({
                options,
                customFields
            }));
        }
        (0, graphql_1.Args)({
            name: (options === null || options === void 0 ? void 0 : options.name) || 'where',
            nullable: true,
            type: () => filterFullType,
        }, ...pipes)(target, propertyName, paramIndex);
    };
};
exports.Filter = Filter;
let FilterPipe = class FilterPipe {
    constructor(args) {
        this.args = args;
    }
    transform(value, _metadata) {
        return (0, query_builder_1.convertFilterParameters)(value, this.args.customFields, this.args.options);
    }
};
exports.FilterPipe = FilterPipe;
exports.FilterPipe = FilterPipe = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], FilterPipe);
//# sourceMappingURL=resolver.decorator.js.map