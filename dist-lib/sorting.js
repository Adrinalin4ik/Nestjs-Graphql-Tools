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
exports.applySortingParameter = exports.GraphqlSorting = exports.Sorting = exports.SortInputMapPrefixes = exports.SortType = void 0;
const graphql_1 = require("@nestjs/graphql");
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
    SortInputMapPrefixes["PropertyFilterType"] = "PropertySortType";
    SortInputMapPrefixes["FilterInputType"] = "SortInputType";
})(SortInputMapPrefixes = exports.SortInputMapPrefixes || (exports.SortInputMapPrefixes = {}));
const sortFullTypes = new Map();
const sortTypes = new Map();
function generateSortInputType(classRef) {
    const key = `${classRef.name}${SortInputMapPrefixes.PropertyFilterType}`;
    if (sortTypes.get(key)) {
        return sortTypes.get(key);
    }
    (0, graphql_1.PartialType)(classRef, graphql_1.InputType);
    const classMetadata = graphql_1.TypeMetadataStorage.getObjectTypeMetadataByTarget(classRef);
    graphql_1.TypeMetadataStorage.loadClassPluginMetadata([classMetadata]);
    graphql_1.TypeMetadataStorage.compileClassMetadata([classMetadata]);
    const objectTypesMetadata = graphql_1.TypeMetadataStorage.getObjectTypesMetadata();
    const inheritedType = objectTypesMetadata.find(x => x.target.name === (classRef === null || classRef === void 0 ? void 0 : classRef.__extension__));
    if (inheritedType) {
        graphql_1.TypeMetadataStorage.loadClassPluginMetadata([inheritedType]);
        graphql_1.TypeMetadataStorage.compileClassMetadata([inheritedType]);
    }
    class PartialObjectType {
    }
    (0, graphql_1.InputType)(key, { isAbstract: true })(PartialObjectType);
    const t = graphql_1.TypeMetadataStorage;
    Object.defineProperty(PartialObjectType, 'name', {
        value: key,
    });
    sortTypes.set(key, PartialObjectType);
    if (!(classMetadata === null || classMetadata === void 0 ? void 0 : classMetadata.properties)) {
        throw new Error(`DTO ${classRef.name} hasn't been initialized yet`);
    }
    const properties = [...((inheritedType === null || inheritedType === void 0 ? void 0 : inheritedType.properties) || []), ...classMetadata.properties];
    for (const field of properties) {
        const targetClassMetadata = graphql_1.TypeMetadataStorage.getObjectTypeMetadataByTarget(field.typeFn());
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
const getSortFullInputType = (classRef) => {
    const key = `sort${classRef.name}Input`;
    if (sortFullTypes.get(key)) {
        return sortFullTypes.get(key);
    }
    const FilterInputType = generateSortInputType(classRef);
    let EntityWhereInput = class EntityWhereInput extends FilterInputType {
    };
    __decorate([
        (0, graphql_1.Field)({ defaultValue: 'SortingPropertyDecorator' }),
        __metadata("design:type", String)
    ], EntityWhereInput.prototype, "_name_", void 0);
    EntityWhereInput = __decorate([
        (0, graphql_1.InputType)(key)
    ], EntityWhereInput);
    sortFullTypes.set(key, EntityWhereInput);
    return EntityWhereInput;
};
const Sorting = (baseEntity, options) => {
    const filterFullType = getSortFullInputType(baseEntity());
    return (target, propertyName, paramIndex) => {
        (0, graphql_1.Args)({
            name: (options === null || options === void 0 ? void 0 : options.name) || 'order_by',
            nullable: true,
            defaultValue: {},
            type: () => [filterFullType],
        })(target, propertyName, paramIndex);
    };
};
exports.Sorting = Sorting;
const GraphqlSorting = (options) => {
    return (_target, _property, descriptor) => {
        const actualDescriptor = descriptor.value;
        descriptor.value = function (...args) {
            (0, exports.applySortingParameter)(args, options === null || options === void 0 ? void 0 : options.alias);
            return actualDescriptor.call(this, ...args);
        };
    };
};
exports.GraphqlSorting = GraphqlSorting;
const applySortingParameter = (args, alias) => {
    const sortArgIndex = args.findIndex(x => Array.isArray(x) && (x === null || x === void 0 ? void 0 : x.some(x => x._name_ === 'SortingPropertyDecorator')));
    if (sortArgIndex != -1) {
        args[sortArgIndex] = convertParameters(args[sortArgIndex], alias);
    }
};
exports.applySortingParameter = applySortingParameter;
const convertParameters = (parameters, alias) => {
    return parameters.reduce((accumulatedParams, x) => {
        delete x._name_;
        const convertedParams = Object.entries(x).reduce((acc, [k, v]) => {
            if (alias) {
                acc[`${alias}.${k}`] = v;
            }
            else {
                acc[k] = v;
            }
            return acc;
        }, {});
        return Object.assign(Object.assign({}, accumulatedParams), convertedParams);
    }, {});
};
//# sourceMappingURL=sorting.js.map