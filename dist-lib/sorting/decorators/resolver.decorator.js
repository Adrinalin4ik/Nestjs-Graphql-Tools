"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sorting = exports.GraphqlSorting = void 0;
const graphql_1 = require("@nestjs/graphql");
const functions_1 = require("../../utils/functions");
const constants_1 = require("../constants");
const input_type_generator_1 = require("../input-type-generator");
const query_builder_1 = require("../query.builder");
const GraphqlSorting = () => {
    return (target, property, descriptor) => {
        const actualDescriptor = descriptor.value;
        descriptor.value = function (...args) {
            (0, query_builder_1.applySortingParameter)(args, target, property);
            return actualDescriptor.call(this, ...args);
        };
        Reflect.defineMetadata(constants_1.GRAPHQL_SORTING_DECORATOR_METADATA_KEY, '', target, property);
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
        Reflect.defineMetadata(constants_1.SORTING_DECORATOR_INDEX_METADATA_KEY, paramIndex, target, propertyName);
        Reflect.defineMetadata(constants_1.SORTING_DECORATOR_OPTIONS_METADATA_KEY, options, target, propertyName);
        Reflect.defineMetadata(constants_1.SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, customFields, target, propertyName);
        (0, graphql_1.Args)({
            name: (options === null || options === void 0 ? void 0 : options.name) || 'order_by',
            nullable: true,
            type: () => [sortingFullType],
        })(target, propertyName, paramIndex);
    };
};
exports.Sorting = Sorting;
//# sourceMappingURL=resolver.decorator.js.map