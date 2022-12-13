"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SortingField = void 0;
const constants_1 = require("../constants");
const SortingField = (options = {}) => {
    return (target, property) => {
        const meta = Reflect.getMetadata(constants_1.SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target);
        let metadataObject = meta;
        if (!meta) {
            metadataObject = {
                fields: new Map()
            };
        }
        if (options && !options.sqlExp) {
            options.sqlExp = property;
        }
        if (metadataObject.fields.has(property)) {
            const field = metadataObject.fields.get(property);
            metadataObject.fields.set(property, Object.assign(Object.assign({}, field), options));
        }
        else {
            metadataObject.fields.set(property, Object.assign({ name: property }, options));
        }
        Reflect.defineMetadata(constants_1.SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, metadataObject, target);
    };
};
exports.SortingField = SortingField;
//# sourceMappingURL=field.decorator.js.map