"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySortingParameter = void 0;
const constants_1 = require("./constants");
const applySortingParameter = (args, target, property) => {
    const sortingArgIndex = Reflect.getMetadata(constants_1.SORTING_DECORATOR_INDEX_METADATA_KEY, target, property);
    if (sortingArgIndex !== undefined) {
        const options = Reflect.getMetadata(constants_1.SORTING_DECORATOR_OPTIONS_METADATA_KEY, target, property);
        const customFields = Reflect.getMetadata(constants_1.SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target, property);
        args[sortingArgIndex] = convertParameters(args[sortingArgIndex], customFields, options);
    }
};
exports.applySortingParameter = applySortingParameter;
const convertParameters = (parameters, customFields, options) => {
    if (!Array.isArray(parameters))
        return parameters;
    return parameters && parameters.reduce((accumulatedParams, x) => {
        const convertedParams = Object.entries(x).reduce((acc, [k, v]) => {
            if (customFields.has(k)) {
                const field = customFields.get(k);
                acc[field.sqlExp] = v;
            }
            else {
                if (options === null || options === void 0 ? void 0 : options.sqlAlias) {
                    acc[`${options === null || options === void 0 ? void 0 : options.sqlAlias}.${k}`] = v;
                }
                else {
                    acc[k] = v;
                }
            }
            return acc;
        }, {});
        return Object.assign(Object.assign({}, accumulatedParams), convertedParams);
    }, {}) || {};
};
//# sourceMappingURL=query.builder.js.map