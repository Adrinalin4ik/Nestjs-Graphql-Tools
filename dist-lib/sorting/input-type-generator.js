"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
})(SortType = exports.SortType || (exports.SortType = {}));
(0, graphql_1.registerEnumType)(SortType, {
    name: 'SortType',
});
var SortInputMapPrefixes;
(function (SortInputMapPrefixes) {
    SortInputMapPrefixes["PropertySortingType"] = "PropertySortType";
    SortInputMapPrefixes["SortingInputType"] = "SortInputType";
})(SortInputMapPrefixes = exports.SortInputMapPrefixes || (exports.SortInputMapPrefixes = {}));
const sortingFullTypes = new Map();
const sortingTypes = new Map();
function generateSortingInputType(classes) {
    const concatinatedClassNames = classes.map(x => x.name).join('');
    const key = `${concatinatedClassNames}${SortInputMapPrefixes.PropertySortingType}`;
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
            properties.push(...customSortingData.fields.values());
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
            properties.push(...((inheritedType === null || inheritedType === void 0 ? void 0 : inheritedType.properties) || []), ...classMetadata.properties);
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
const getSortingFullInputType = (classes) => {
    const concatinatedClassName = classes.map(x => x.name).join('');
    const key = `sorting${concatinatedClassName}Input`;
    if (sortingFullTypes.get(key)) {
        return sortingFullTypes.get(key);
    }
    const SortingInputType = generateSortingInputType(classes);
    let EntitySortingInput = class EntitySortingInput extends SortingInputType {
    };
    __decorate([
        (0, graphql_1.Field)({ defaultValue: constants_1.SORTING_DECORATOR_NAME_METADATA_KEY }),
        __metadata("design:type", String)
    ], EntitySortingInput.prototype, "_name_", void 0);
    EntitySortingInput = __decorate([
        (0, graphql_1.InputType)(key)
    ], EntitySortingInput);
    sortingFullTypes.set(key, EntitySortingInput);
    return EntitySortingInput;
};
exports.getSortingFullInputType = getSortingFullInputType;
//# sourceMappingURL=input-type-generator.js.map