"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractUnionsData = exports.getSelectedUnionTypes = exports.SelectedUnionTypes = void 0;
const common_1 = require("@nestjs/common");
const field_extractor_1 = require("./field-extractor");
exports.SelectedUnionTypes = (0, common_1.createParamDecorator)((data, ctx) => {
    const args = ctx.getArgs();
    const info = args[3];
    return getSelectedUnionTypes(info, data);
});
function getSelectedUnionTypes(info, options) {
    const returnObj = {
        has(entity) {
            if (typeof entity === 'string') {
                return this['types'].has(entity);
            }
            else {
                return this['types'].has(entity.name);
            }
        },
        getFields(entity) {
            let fields = [];
            if (typeof entity === 'string') {
                fields = this['types'].get(entity);
            }
            else {
                fields = this['types'].get(entity.name);
            }
            return fields.map(field => (options === null || options === void 0 ? void 0 : options.sqlAlias) ? `${options === null || options === void 0 ? void 0 : options.sqlAlias}.${field}` : field);
        },
        types: null
    };
    Object.defineProperty(returnObj, 'types', {
        get: () => {
            const rowFieldsData = extractUnionsData(info.fieldNodes, (options === null || options === void 0 ? void 0 : options.nestedPolymorphicResolverName) || info.fieldName, info.fragments);
            return rowFieldsData;
        },
    });
    return returnObj;
}
exports.getSelectedUnionTypes = getSelectedUnionTypes;
function extractUnionsData(resolvers, field, fragments) {
    let results = new Map([]);
    function process(resolvers, field, fragments) {
        for (const resolver of resolvers) {
            if (resolver.kind === 'Field' && resolver.selectionSet) {
                const unifiedName = resolver.name.value;
                if (unifiedName === field) {
                    resolver.selectionSet.selections.forEach((item) => {
                        if (item.kind === 'Field') {
                            return;
                        }
                        else if (item.kind === 'FragmentSpread') {
                            const fragment = fragments[item.name.value];
                            if (fragment === null || fragment === void 0 ? void 0 : fragment.selectionSet) {
                                process(fragment.selectionSet.selections, field, fragments);
                            }
                        }
                        else if (item.kind === 'InlineFragment') {
                            const data = (0, field_extractor_1.extractFieldsData)(item.selectionSet.selections, item.typeCondition.name.value, fragments, true);
                            results.set(item.typeCondition.name.value, [...data]);
                            process(item.selectionSet.selections, field, fragments);
                        }
                    });
                    return results;
                }
                else {
                    return process(resolver.selectionSet.selections, field, fragments);
                }
            }
        }
        return results;
    }
    process(resolvers, field, fragments);
    return results;
}
exports.extractUnionsData = extractUnionsData;
//# sourceMappingURL=union-type-extractor.js.map