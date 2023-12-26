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
exports.getFilterFullInputType = exports.EObjectResolveType = exports.InputMapPrefixes = exports.OperationQuery = void 0;
const graphql_1 = require("@nestjs/graphql");
const functions_1 = require("../utils/functions");
const constants_1 = require("./constants");
var OperationQuery;
(function (OperationQuery) {
    OperationQuery["eq"] = "eq";
    OperationQuery["neq"] = "neq";
    OperationQuery["gt"] = "gt";
    OperationQuery["gte"] = "gte";
    OperationQuery["lt"] = "lt";
    OperationQuery["lte"] = "lte";
    OperationQuery["in"] = "in";
    OperationQuery["notin"] = "notin";
    OperationQuery["like"] = "like";
    OperationQuery["notlike"] = "notlike";
    OperationQuery["between"] = "between";
    OperationQuery["notbetween"] = "notbetween";
    OperationQuery["null"] = "null";
})(OperationQuery || (exports.OperationQuery = OperationQuery = {}));
const arrayLikeOperations = new Set([OperationQuery.between, OperationQuery.notbetween, OperationQuery.in, OperationQuery.notin]);
const stringLikeOperations = new Set([OperationQuery.like, OperationQuery.notlike]);
var InputMapPrefixes;
(function (InputMapPrefixes) {
    InputMapPrefixes["PropertyFilterInputType"] = "PropertyFilterInputType";
    InputMapPrefixes["FilterInputType"] = "FilterInputType";
})(InputMapPrefixes || (exports.InputMapPrefixes = InputMapPrefixes = {}));
var EObjectResolveType;
(function (EObjectResolveType) {
    EObjectResolveType[EObjectResolveType["Full"] = 0] = "Full";
    EObjectResolveType[EObjectResolveType["Enum"] = 1] = "Enum";
})(EObjectResolveType || (exports.EObjectResolveType = EObjectResolveType = {}));
const filterFullTypes = new Map();
const filterTypes = new Map();
const propertyTypes = new Map();
const generateFilterPropertyType = (field) => {
    var _a;
    let typeName = field.typeFn && ((_a = field.typeFn()) === null || _a === void 0 ? void 0 : _a.name);
    let objectResolveType = EObjectResolveType.Full;
    if (field.typeFn && !typeName) {
        const enumMeta = graphql_1.TypeMetadataStorage.getEnumsMetadata().find(x => x.ref === field.typeFn());
        typeName = enumMeta.name;
        objectResolveType = EObjectResolveType.Enum;
    }
    const key = `${(0, functions_1.standardize)(typeName)}_${InputMapPrefixes.PropertyFilterInputType}`;
    const propType = propertyTypes.get(key);
    if (propType)
        return propType;
    class PropertyFilter {
    }
    (0, graphql_1.InputType)(key, { isAbstract: true })(PropertyFilter);
    const availableOperations = Object.keys(OperationQuery).filter((operation) => {
        if (objectResolveType === EObjectResolveType.Enum) {
            return [
                OperationQuery.eq,
                OperationQuery.neq,
                OperationQuery.in,
                OperationQuery.notin,
                OperationQuery.null
            ].includes(operation);
        }
        else {
            return true;
        }
    });
    availableOperations.forEach(operationName => {
        field.typeFn();
        (0, graphql_1.Field)(() => {
            if (arrayLikeOperations.has(OperationQuery[operationName])) {
                return [field.typeFn()];
            }
            if ([OperationQuery.null].includes(OperationQuery[operationName])) {
                return Boolean;
            }
            else if (stringLikeOperations.has(OperationQuery[operationName])) {
                return String;
            }
            else {
                return field.typeFn();
            }
        }, Object.assign(Object.assign({}, field.options), { nullable: true }))(PropertyFilter.prototype, constants_1.FILTER_OPERATION_PREFIX ? `${constants_1.FILTER_OPERATION_PREFIX}${operationName}` : operationName);
    });
    Object.defineProperty(PropertyFilter, 'name', {
        value: key,
    });
    propertyTypes.set(key, PropertyFilter);
    return PropertyFilter;
};
function generateFilterInputType(classes, name) {
    const key = `${name}${InputMapPrefixes.FilterInputType}`;
    if (filterTypes.get(key)) {
        return filterTypes.get(key);
    }
    class PartialObjectType {
    }
    (0, graphql_1.InputType)(key, { isAbstract: true })(PartialObjectType);
    Object.defineProperty(PartialObjectType, 'name', {
        value: key,
    });
    filterTypes.set(key, PartialObjectType);
    const properties = [];
    for (const typeFn of classes) {
        const customFilterData = Reflect.getMetadata(constants_1.FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, typeFn.prototype);
        if (customFilterData && customFilterData.fields.size > 0) {
            properties.push(...Array.from(customFilterData.fields.values()).filter(x => !(customFilterData === null || customFilterData === void 0 ? void 0 : customFilterData.excludedFilterFields.has(x.name))));
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
            if (customFilterData) {
                classMetaProps = classMetadata.properties.filter(x => !(customFilterData === null || customFilterData === void 0 ? void 0 : customFilterData.excludedFilterFields.has(x.name)));
            }
            properties.push(...((inheritedType === null || inheritedType === void 0 ? void 0 : inheritedType.properties) || []), ...classMetaProps);
        }
        else {
            (0, graphql_1.PartialType)(typeFn, graphql_1.InputType);
        }
    }
    for (const field of properties) {
        const targetClassMetadata = graphql_1.TypeMetadataStorage.getObjectTypeMetadataByTarget(field.typeFn && field.typeFn());
        if (!targetClassMetadata) {
            if (typeof field.typeFn === 'function') {
                field.typeFn();
            }
            const fieldType = generateFilterPropertyType(field);
            (0, graphql_1.Field)(() => fieldType, { nullable: true })(PartialObjectType.prototype, field.name);
        }
        else {
        }
    }
    return PartialObjectType;
}
const getFilterFullInputType = (classes, name) => {
    const key = `${name}_FilterInputType`;
    if (filterFullTypes.get(key)) {
        return filterFullTypes.get(key);
    }
    const FilterInputType = generateFilterInputType(classes, name);
    let EntityWhereInput = class EntityWhereInput extends FilterInputType {
    };
    __decorate([
        (0, graphql_1.Field)(() => [FilterInputType], { nullable: true }),
        __metadata("design:type", Array)
    ], EntityWhereInput.prototype, "and", void 0);
    __decorate([
        (0, graphql_1.Field)(() => [FilterInputType], { nullable: true }),
        __metadata("design:type", Array)
    ], EntityWhereInput.prototype, "or", void 0);
    EntityWhereInput = __decorate([
        (0, graphql_1.InputType)(key)
    ], EntityWhereInput);
    filterFullTypes.set(key, EntityWhereInput);
    return EntityWhereInput;
};
exports.getFilterFullInputType = getFilterFullInputType;
//# sourceMappingURL=input-type-generator.js.map