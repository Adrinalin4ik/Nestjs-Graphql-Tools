"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSortingFullInputType = exports.SortInputMapPrefixes = exports.SortType = void 0;
const graphql_1 = require("@nestjs/graphql");
const constants_1 = require("./constants");
var SortType;
(function (SortType) {
    SortType["ASC"] = "ASC";
    SortType["DESC"] = "DESC";
    SortType["ASC_NULLS_LAST"] = "ASC NULLS LAST";
    SortType["ASC_NULLS_FIRST"] = "ASC NULLS FIRST";
    SortType["DESC_NULLS_LAST"] = "DESC NULLS LAST";
    SortType["DESC_NULLS_FIRST"] = "DESC NULLS FIRST";
})(SortType || (exports.SortType = SortType = {}));
(0, graphql_1.registerEnumType)(SortType, {
    name: 'SortType',
});
var SortInputMapPrefixes;
(function (SortInputMapPrefixes) {
    SortInputMapPrefixes["SortingInputType"] = "SortingInputType";
})(SortInputMapPrefixes || (exports.SortInputMapPrefixes = SortInputMapPrefixes = {}));
const sortingFullTypes = new Map();
const sortingTypes = new Map();
function generateSortingInputType(classes, name) {
    const key = `${name}_${SortInputMapPrefixes.SortingInputType}`;
    if (sortingTypes.get(key)) {
        return sortingTypes.get(key);
    }
    class PartialObjectType {
    }
    (0, graphql_1.InputType)(key, { isAbstract: true })(PartialObjectType);
    Object.defineProperty(PartialObjectType, 'name', {
        value: key,
    });
    sortingTypes.set(key, PartialObjectType);
    const properties = [];
    for (const typeFn of classes) {
        const customSortingData = Reflect.getMetadata(constants_1.SORTING_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, typeFn.prototype);
        if (customSortingData) {
            properties.push(...Array.from(customSortingData.fields.values()).filter(x => !(customSortingData === null || customSortingData === void 0 ? void 0 : customSortingData.excludedFilterFields.has(x.name))));
        }
        const classMetadata = graphql_1.TypeMetadataStorage.getObjectTypeMetadataByTarget(typeFn);
        if (classMetadata) {
            (0, graphql_1.PartialType)(typeFn, graphql_1.InputType);
            graphql_1.TypeMetadataStorage.loadClassPluginMetadata([classMetadata]);
            graphql_1.TypeMetadataStorage.compileClassMetadata([classMetadata]);
            const objectTypesMetadata = graphql_1.TypeMetadataStorage.getObjectTypesMetadata();
            const inheritedType = objectTypesMetadata.find(x => x.target.name === (typeFn === null || typeFn === void 0 ? void 0 : typeFn.__extension__));
            if (inheritedType) {
                graphql_1.TypeMetadataStorage.loadClassPluginMetadata([inheritedType]);
                graphql_1.TypeMetadataStorage.compileClassMetadata([inheritedType]);
            }
            if (!(classMetadata === null || classMetadata === void 0 ? void 0 : classMetadata.properties)) {
                throw new Error(`DTO ${typeFn.name} hasn't been initialized yet`);
            }
            let classMetaProps = classMetadata.properties;
            if (customSortingData) {
                classMetaProps = classMetadata.properties.filter(x => !(customSortingData === null || customSortingData === void 0 ? void 0 : customSortingData.excludedFilterFields.has(x.name)));
            }
            properties.push(...((inheritedType === null || inheritedType === void 0 ? void 0 : inheritedType.properties) || []), ...classMetaProps);
        }
    }
    for (const field of properties) {
        const targetClassMetadata = graphql_1.TypeMetadataStorage.getObjectTypeMetadataByTarget(field.typeFn && field.typeFn());
        if (!targetClassMetadata) {
            if (typeof field.typeFn === 'function') {
                field.typeFn();
            }
            (0, graphql_1.Field)(() => SortType, { nullable: true })(PartialObjectType.prototype, field.name);
        }
        else {
        }
    }
    return PartialObjectType;
}
const getSortingFullInputType = (classes, name) => {
    const key = `${name}_SortingInputType`;
    if (sortingFullTypes.get(key)) {
        return sortingFullTypes.get(key);
    }
    const SortingInputType = generateSortingInputType(classes, name);
    let EntitySortingInput = class EntitySortingInput extends SortingInputType {
    };
    EntitySortingInput = __decorate([
        (0, graphql_1.InputType)(key)
    ], EntitySortingInput);
    sortingFullTypes.set(key, EntitySortingInput);
    return EntitySortingInput;
};
exports.getSortingFullInputType = getSortingFullInputType;
//# sourceMappingURL=input-type-generator.js.map