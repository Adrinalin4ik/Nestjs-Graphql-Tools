"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFieldsData = exports.SelectedFields = exports.GraphqlFieldMetadataKey = void 0;
const common_1 = require("@nestjs/common");
exports.GraphqlFieldMetadataKey = 'graphql:fieldsData';
exports.SelectedFields = (0, common_1.createParamDecorator)((data, ctx) => {
    const args = ctx.getArgs();
    const info = args[3];
    const returnObj = {
        ctx,
    };
    Object.defineProperty(returnObj, 'fieldsData', {
        get: () => {
            const rowFieldsData = extractFieldsData(info.fieldNodes, info.fieldName, info.fragments);
            const fieldsString = Array.from(rowFieldsData.values()).map((fieldName) => {
                if (data === null || data === void 0 ? void 0 : data.sqlAlias) {
                    return `${data.sqlAlias}.${fieldName}`;
                }
                else {
                    return fieldName;
                }
            });
            return {
                rowFieldsData,
                fieldsString,
            };
        },
    });
    return returnObj;
});
function extractFieldsData(resolvers, field, fragments, from_fragment = false) {
    let results = new Set([]);
    if (from_fragment) {
        for (const resolver of resolvers) {
            if (resolver.kind === 'Field' && (resolver === null || resolver === void 0 ? void 0 : resolver.name.value) === '__typename') {
                continue;
            }
            if (resolver.kind === 'Field' && !resolver.selectionSet) {
                results.add(resolver.name.value);
            }
            else if (resolver.kind === 'FragmentSpread') {
                const fragment = fragments[resolver.name.value];
                if (fragment === null || fragment === void 0 ? void 0 : fragment.selectionSet) {
                    results = new Set([
                        ...results,
                        ...extractFieldsData(fragment.selectionSet.selections, field, fragments, true),
                    ]);
                }
            }
        }
        return results;
    }
    for (const resolver of resolvers) {
        if (resolver.kind === 'Field' && resolver.selectionSet) {
            const unifiedName = resolver.name.value;
            if (unifiedName === field) {
                resolver.selectionSet.selections.forEach((item) => {
                    if (item.kind === 'Field' && (item === null || item === void 0 ? void 0 : item.name.value) === '__typename') {
                        return;
                    }
                    if (item.kind === 'Field' && !item.selectionSet) {
                        results.add(item.name.value);
                    }
                    else if (item.kind === 'FragmentSpread') {
                        const fragment = fragments[item.name.value];
                        if (fragment === null || fragment === void 0 ? void 0 : fragment.selectionSet) {
                            results = new Set([
                                ...results,
                                ...extractFieldsData(fragment.selectionSet.selections, field, fragments, true),
                            ]);
                        }
                    }
                    else if (item.kind === 'InlineFragment' && item.selectionSet) {
                        results = new Set([
                            ...results,
                            ...extractFieldsData(item.selectionSet.selections, field, fragments, true),
                        ]);
                    }
                });
                return results;
            }
            else {
                return extractFieldsData(resolver.selectionSet.selections, field, fragments, false);
            }
        }
    }
    return results;
}
exports.extractFieldsData = extractFieldsData;
//# sourceMappingURL=field-extractor.js.map