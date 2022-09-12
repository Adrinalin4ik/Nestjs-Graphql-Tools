"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectedUnionTypes = void 0;
const common_1 = require("@nestjs/common");
const GraphqlFieldMetadataKey = 'graphql:fieldsData';
exports.SelectedUnionTypes = (0, common_1.createParamDecorator)((data, ctx) => {
    const args = ctx.getArgs();
    const info = args[3];
    const returnObj = {
        ctx,
        has(entity) {
            if (typeof entity === 'string') {
                return this['typesSet'].has(entity);
            }
            else {
                return this['typesSet'].has(entity.name);
            }
        }
    };
    Object.defineProperty(returnObj, 'typesSet', {
        get: () => {
            const rowFieldsData = extractFieldsData(info.fieldNodes, info.fieldName, info.fragments);
            return rowFieldsData;
        },
    });
    return returnObj;
});
function extractFieldsData(resolvers, field, fragments) {
    let results = new Set([]);
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
                            results = new Set([
                                ...results,
                                ...extractFieldsData(fragment.selectionSet.selections, field, fragments),
                            ]);
                        }
                    }
                    else if (item.kind === 'InlineFragment') {
                        results.add(item.typeCondition.name.value);
                        results = new Set([
                            ...results,
                            ...extractFieldsData(item.selectionSet.selections, field, fragments)
                        ]);
                    }
                });
                return results;
            }
            else {
                return extractFieldsData(resolver.selectionSet.selections, field, fragments);
            }
        }
    }
    return results;
}
//# sourceMappingURL=union-type-extractor.js.map