"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterField = exports.GraphqlFilterTypeDecoratorMetadata = void 0;
const constants_1 = require("../constants");
class GraphqlFilterTypeDecoratorMetadata {
    constructor(target) {
        this.target = target;
        this.fields = new Map();
        this.excludedFilterFields = new Set();
        const meta = Reflect.getMetadata(constants_1.FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target);
        if (meta) {
            this.fields = meta.fields;
        }
    }
    save() {
        Reflect.defineMetadata(constants_1.FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, this, this.target);
    }
}
exports.GraphqlFilterTypeDecoratorMetadata = GraphqlFilterTypeDecoratorMetadata;
function FilterField(typeFn, options = {}) {
    return (target, property) => {
        const metadataObject = new GraphqlFilterTypeDecoratorMetadata(target);
        if (typeof typeFn !== 'function') {
            metadataObject.excludedFilterFields.add(property);
        }
        else {
            if (options && !options.sqlExp) {
                options.sqlExp = property;
            }
            if (metadataObject.fields.has(property)) {
                const field = metadataObject.fields.get(property);
                metadataObject.fields.set(property, Object.assign(Object.assign({}, field), options));
            }
            else {
                metadataObject.fields.set(property, Object.assign({ name: property, typeFn }, options));
            }
        }
        metadataObject.save();
    };
}
exports.FilterField = FilterField;
//# sourceMappingURL=field.decorator.js.map