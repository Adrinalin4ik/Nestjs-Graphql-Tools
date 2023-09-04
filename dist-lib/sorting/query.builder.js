"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSortingParameters = void 0;
const convertSortingParameters = (parameters, customFields, options) => {
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
exports.convertSortingParameters = convertSortingParameters;
//# sourceMappingURL=query.builder.js.map