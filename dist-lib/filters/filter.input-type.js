"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterField = exports.FilterInputType = exports.CUSTOM_FILTER_INPUT_TYPE_PROPERTY_DECORATOR_NAME = exports.CUSTOM_FILTER_INPUT_TYPE_DECORATOR_NAME = void 0;
exports.CUSTOM_FILTER_INPUT_TYPE_DECORATOR_NAME = 'GraphqlFilterInputTypeDecorator';
exports.CUSTOM_FILTER_INPUT_TYPE_PROPERTY_DECORATOR_NAME = 'GraphqlFilterFieldTypeDecorator';
const FilterInputType = () => {
    return (target) => {
        const meta = Reflect.getMetadata(exports.CUSTOM_FILTER_INPUT_TYPE_DECORATOR_NAME, target.prototype);
        const fields = new Map();
        for (const field of meta.fields) {
            fields.set(field.name, field);
        }
        target.prototype.filterInputType = true;
        target.prototype.getFields = () => {
            return meta.fields || [];
        };
        target.prototype.getFieldByName = (name) => {
            return fields.get(name);
        };
    };
};
exports.FilterInputType = FilterInputType;
const FilterField = (typeFn, options = {}) => {
    return (target, property) => {
        const meta = Reflect.getMetadata(exports.CUSTOM_FILTER_INPUT_TYPE_DECORATOR_NAME, target);
        let fields = meta === null || meta === void 0 ? void 0 : meta.fields;
        if (!meta) {
            fields = [];
        }
        if (options && !options.sqlExp) {
            options.sqlExp = property;
        }
        Reflect.defineMetadata(exports.CUSTOM_FILTER_INPUT_TYPE_DECORATOR_NAME, {
            fields: [
                ...fields,
                {
                    name: property,
                    typeFn,
                    options
                }
            ]
        }, target);
    };
};
exports.FilterField = FilterField;
//# sourceMappingURL=filter.input-type.js.map