"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Filter = exports.GraphqlFilter = void 0;
const graphql_1 = require("@nestjs/graphql");
const functions_1 = require("../../utils/functions");
const constants_1 = require("../constants");
const input_type_generator_1 = require("../input-type-generator");
const query_builder_1 = require("../query.builder");
const GraphqlFilter = () => {
    return (target, property, descriptor) => {
        const actualDescriptor = descriptor.value;
        descriptor.value = function (...args) {
            (0, query_builder_1.applyFilterParameter)(args, target, property);
            return actualDescriptor.call(this, ...args);
        };
        Reflect.defineMetadata(constants_1.GRAPHQL_FILTER_DECORATOR_METADATA_KEY, '', target, property);
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
        Reflect.defineMetadata(constants_1.FILTER_DECORATOR_INDEX_METADATA_KEY, paramIndex, target, propertyName);
        Reflect.defineMetadata(constants_1.FILTER_DECORATOR_OPTIONS_METADATA_KEY, options, target, propertyName);
        Reflect.defineMetadata(constants_1.FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, customFields, target, propertyName);
        (0, graphql_1.Args)({
            name: (options === null || options === void 0 ? void 0 : options.name) || 'where',
            nullable: true,
            type: () => filterFullType,
        })(target, propertyName, paramIndex);
    };
};
exports.Filter = Filter;
//# sourceMappingURL=resolver.decorator.js.map