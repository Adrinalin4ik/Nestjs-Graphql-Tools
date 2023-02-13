"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SortingField = exports.GraphqlSortingTypeDecoratorMetadata = void 0;
const constants_1 = require("../constants");
class GraphqlSortingTypeDecoratorMetadata {
    constructor(target) {
        this.target = target;
        this.fields = new Map();
        this.excludedFilterFields = new Set();
        const meta = Reflect.getMetadata(constants_1.SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target);
        if (meta) {
            this.fields = meta.fields;
        }
    }
    save() {
        Reflect.defineMetadata(constants_1.SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, this, this.target);
    }
}
exports.GraphqlSortingTypeDecoratorMetadata = GraphqlSortingTypeDecoratorMetadata;
const SortingField = (options = {}) => {
    return (target, property) => {
        const metadataObject = new GraphqlSortingTypeDecoratorMetadata(target);
        if (options.hasOwnProperty('exclude')) {
            options = options;
            metadataObject.excludedFilterFields.add(property);
        }
        else {
            options = options;
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
        }
        metadataObject.save();
    };
};
exports.SortingField = SortingField;
//# sourceMappingURL=field.decorator.js.map