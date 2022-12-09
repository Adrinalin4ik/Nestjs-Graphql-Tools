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
exports.applyFilterParameter = exports.GraphqlFilter = exports.Filter = exports.InputMapPrefixes = exports.OperationQuery = exports.FILTER_DECORATOR_OPTIONS_METADATA_KEY = exports.FILTER_DECORATOR_NAME_METADATA_KEY = exports.GRAPHQL_FILTER_DECORATOR_METADATA_KEY = void 0;
const graphql_1 = require("@nestjs/graphql");
const typeorm_1 = require("typeorm");
exports.GRAPHQL_FILTER_DECORATOR_METADATA_KEY = 'GraphqlFilterDecorator';
exports.FILTER_DECORATOR_NAME_METADATA_KEY = 'FilterPropertyDecorator';
exports.FILTER_DECORATOR_OPTIONS_METADATA_KEY = 'FilterPropertyDecoratorOptions';
const FILTER_OPERATION_PREFIX = process.env.FILTER_OPERATION_PREFIX || undefined;
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
})(OperationQuery = exports.OperationQuery || (exports.OperationQuery = {}));
const arrayLikeOperations = new Set([OperationQuery.between, OperationQuery.notbetween, OperationQuery.in]);
var InputMapPrefixes;
(function (InputMapPrefixes) {
    InputMapPrefixes["PropertyFilterType"] = "PropertyFilterType";
    InputMapPrefixes["FilterInputType"] = "FilterInputType";
})(InputMapPrefixes = exports.InputMapPrefixes || (exports.InputMapPrefixes = {}));
const filterFullTypes = new Map();
const filterTypes = new Map();
const propertyTypes = new Map();
const generateFilterPropertyType = (field, parentName) => {
    const key = `${field.name}${parentName}${InputMapPrefixes.PropertyFilterType}`;
    const propType = propertyTypes.get(key);
    if (propType)
        return propType;
    class PropertyFilter {
    }
    (0, graphql_1.InputType)(key, { isAbstract: true })(PropertyFilter);
    Object.keys(OperationQuery).forEach(operationName => {
        field.typeFn();
        (0, graphql_1.Field)(() => {
            if (arrayLikeOperations.has(OperationQuery[operationName])) {
                return [field.typeFn()];
            }
            if ([OperationQuery.null].includes(OperationQuery[operationName])) {
                return Boolean;
            }
            else {
                return field.typeFn();
            }
        }, Object.assign(Object.assign({}, field.options), { nullable: true }))(PropertyFilter.prototype, FILTER_OPERATION_PREFIX ? `${FILTER_OPERATION_PREFIX}${operationName}` : operationName);
    });
    Object.defineProperty(PropertyFilter, 'name', {
        value: key,
    });
    propertyTypes.set(key, PropertyFilter);
    return PropertyFilter;
};
function generateFilterInputType(classRef, options) {
    var _a, _b, _c, _d;
    const key = `${classRef.name}${compressFieldsName((_a = options === null || options === void 0 ? void 0 : options.customFilters) === null || _a === void 0 ? void 0 : _a.fields)}${InputMapPrefixes.PropertyFilterType}`;
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
    if (!((_b = options === null || options === void 0 ? void 0 : options.customFilters) === null || _b === void 0 ? void 0 : _b.disableDefaultFilters)) {
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
        if (!(classMetadata === null || classMetadata === void 0 ? void 0 : classMetadata.properties)) {
            throw new Error(`DTO ${classRef.name} hasn't been initialized yet`);
        }
        properties.push(...((inheritedType === null || inheritedType === void 0 ? void 0 : inheritedType.properties) || []), ...classMetadata.properties);
    }
    if ((_d = (_c = options === null || options === void 0 ? void 0 : options.customFilters) === null || _c === void 0 ? void 0 : _c.fields) === null || _d === void 0 ? void 0 : _d.length) {
        properties.push(...options.customFilters.fields);
    }
    for (const field of properties) {
        const targetClassMetadata = graphql_1.TypeMetadataStorage.getObjectTypeMetadataByTarget(field.typeFn());
        if (!targetClassMetadata) {
            if (typeof field.typeFn === 'function') {
                field.typeFn();
            }
            const fieldType = generateFilterPropertyType(field, classRef.name);
            (0, graphql_1.Field)(() => fieldType, { nullable: true })(PartialObjectType.prototype, field.name);
        }
        else {
        }
    }
    return PartialObjectType;
}
const getFilterFullInputType = (classRef, options) => {
    var _a;
    const key = `where${classRef.name}${compressFieldsName((_a = options === null || options === void 0 ? void 0 : options.customFilters) === null || _a === void 0 ? void 0 : _a.fields)}Input`;
    if (filterFullTypes.get(key)) {
        return filterFullTypes.get(key);
    }
    const FilterInputType = generateFilterInputType(classRef, options);
    let EntityWhereInput = class EntityWhereInput extends FilterInputType {
    };
    __decorate([
        (0, graphql_1.Field)({ defaultValue: exports.FILTER_DECORATOR_NAME_METADATA_KEY, description: 'Don\'t touch this field. Reserved for nestjs-graphql-toos purposes.' }),
        __metadata("design:type", String)
    ], EntityWhereInput.prototype, "_name_", void 0);
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
const Filter = (baseEntity, options) => {
    const filterFullType = getFilterFullInputType(baseEntity(), options);
    return (target, propertyName, paramIndex) => {
        Reflect.defineMetadata(exports.FILTER_DECORATOR_OPTIONS_METADATA_KEY, options, target, propertyName);
        (0, graphql_1.Args)({
            name: (options === null || options === void 0 ? void 0 : options.name) || 'where',
            nullable: true,
            defaultValue: {},
            type: () => filterFullType,
        })(target, propertyName, paramIndex);
    };
};
exports.Filter = Filter;
const GraphqlFilter = () => {
    return (target, property, descriptor) => {
        const actualDescriptor = descriptor.value;
        descriptor.value = function (...args) {
            (0, exports.applyFilterParameter)(args, target, property);
            return actualDescriptor.call(this, ...args);
        };
        Reflect.defineMetadata(exports.GRAPHQL_FILTER_DECORATOR_METADATA_KEY, '', target, property);
    };
};
exports.GraphqlFilter = GraphqlFilter;
const applyFilterParameter = (args, target, property) => {
    const filterArgIndex = args.findIndex(x => (x === null || x === void 0 ? void 0 : x._name_) === exports.FILTER_DECORATOR_NAME_METADATA_KEY);
    if (filterArgIndex != -1) {
        const options = Reflect.getMetadata(exports.FILTER_DECORATOR_OPTIONS_METADATA_KEY, target, property);
        args[filterArgIndex] = convertParameters(args[filterArgIndex], options === null || options === void 0 ? void 0 : options.customFilters);
    }
};
exports.applyFilterParameter = applyFilterParameter;
const convertParameters = (parameters, customFilters) => {
    const obj = new typeorm_1.Brackets((qb) => {
        const clonnedParams = Object.assign({}, parameters);
        const extendedParams = customFilters.fields.reduce((acc, x) => {
            acc[x.name] = x;
            return acc;
        }, {});
        delete clonnedParams.and;
        delete clonnedParams.or;
        delete clonnedParams._name_;
        if (parameters === null || parameters === void 0 ? void 0 : parameters.and) {
            qb.andWhere(new typeorm_1.Brackets((andBracketsQb) => {
                for (const op of parameters === null || parameters === void 0 ? void 0 : parameters.and) {
                    const andParameters = recursivelyTransformComparators(op, extendedParams);
                    if ((andParameters === null || andParameters === void 0 ? void 0 : andParameters.typeormWhereQuery) || (andParameters === null || andParameters === void 0 ? void 0 : andParameters.customWhereQuery)) {
                        if (Object.keys(andParameters === null || andParameters === void 0 ? void 0 : andParameters.typeormWhereQuery).length) {
                            andBracketsQb.andWhere(andParameters.typeormWhereQuery);
                        }
                        if (Object.keys(andParameters === null || andParameters === void 0 ? void 0 : andParameters.customWhereQuery).length) {
                            for (const query of andParameters.customWhereQuery) {
                                andBracketsQb.andWhere(query[0], query[1]);
                            }
                        }
                    }
                }
            }));
        }
        if (parameters === null || parameters === void 0 ? void 0 : parameters.or) {
            qb.orWhere(new typeorm_1.Brackets((orBracketsQb) => {
                for (const op of parameters === null || parameters === void 0 ? void 0 : parameters.or) {
                    const orParameters = recursivelyTransformComparators(op, extendedParams);
                    if ((orParameters === null || orParameters === void 0 ? void 0 : orParameters.typeormWhereQuery) || (orParameters === null || orParameters === void 0 ? void 0 : orParameters.customWhereQuery)) {
                        if (Object.keys(orParameters === null || orParameters === void 0 ? void 0 : orParameters.typeormWhereQuery).length) {
                            orBracketsQb.orWhere(orParameters.typeormWhereQuery);
                        }
                        if (Object.keys(orParameters === null || orParameters === void 0 ? void 0 : orParameters.customWhereQuery).length) {
                            for (const query of orParameters.customWhereQuery) {
                                orBracketsQb.orWhere(query[0], query[1]);
                            }
                        }
                    }
                }
            }));
        }
        const basicParameters = recursivelyTransformComparators(clonnedParams, extendedParams);
        if ((basicParameters === null || basicParameters === void 0 ? void 0 : basicParameters.typeormWhereQuery) || (basicParameters === null || basicParameters === void 0 ? void 0 : basicParameters.customWhereQuery)) {
            qb.andWhere(new typeorm_1.Brackets((basicParametersQb) => {
                if (Object.keys(basicParameters === null || basicParameters === void 0 ? void 0 : basicParameters.typeormWhereQuery).length) {
                    basicParametersQb.andWhere(basicParameters.typeormWhereQuery);
                }
                if (Object.keys(basicParameters === null || basicParameters === void 0 ? void 0 : basicParameters.customWhereQuery).length) {
                    for (const query of basicParameters.customWhereQuery) {
                        basicParametersQb.andWhere(query[0], query[1]);
                    }
                }
            }));
        }
    });
    return obj;
};
const recursivelyTransformComparators = (object, extendedParams) => {
    if (!object || !Object.entries(object).length)
        return null;
    const typeormWhereQuery = {};
    const customWhereQuery = [];
    for (const [key, value] of Object.entries(object)) {
        if (typeof value === "object") {
            const operators = Object.entries(value);
            if (operators.length > 1) {
                throw new Error('Inside filter statement should be only one condition operator for each attribute');
            }
            for (const [innerKey, innerValue] of operators) {
                const operatorKey = innerKey.replace(FILTER_OPERATION_PREFIX, '');
                if (extendedParams === null || extendedParams === void 0 ? void 0 : extendedParams[key]) {
                    const rightExpression = extendedParams[key].sqlExp;
                    const argName = `arg_${convertArrayOfStringIntoStringNumber([rightExpression])}`;
                    if (operatorKey === OperationQuery.eq) {
                        customWhereQuery.push([`${rightExpression} = :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === OperationQuery.neq) {
                        customWhereQuery.push([`${rightExpression} != :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === OperationQuery.lt) {
                        customWhereQuery.push([`${rightExpression} < :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === OperationQuery.lte) {
                        customWhereQuery.push([`${rightExpression} <= :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === OperationQuery.gt) {
                        customWhereQuery.push([`${rightExpression} > :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === OperationQuery.gte) {
                        customWhereQuery.push([`${rightExpression} >= :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === OperationQuery.like) {
                        customWhereQuery.push([`${rightExpression} ilike :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === OperationQuery.notlike) {
                        customWhereQuery.push([`${rightExpression} not ilike :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === OperationQuery.between) {
                        customWhereQuery.push([`${rightExpression} between :${argName}1 and :${argName}2`, { [`${argName}1`]: innerValue[0], [`${argName}2`]: innerValue[1] }]);
                    }
                    else if (operatorKey === OperationQuery.notbetween) {
                        customWhereQuery.push([`${rightExpression} not between :${argName}1 and :${argName}2`, { [`${argName}1`]: innerValue[0], [`${argName}2`]: innerValue[1] }]);
                    }
                    else if (operatorKey === OperationQuery.in) {
                        customWhereQuery.push([`${rightExpression} in (...:${argName})`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === OperationQuery.notin) {
                        customWhereQuery.push([`${rightExpression} not in (...:${argName})`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === "any") {
                        customWhereQuery.push([`${rightExpression} any (:${argName})`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === OperationQuery.null) {
                        if (innerValue === 'true') {
                            customWhereQuery.push([`${rightExpression} is null`]);
                        }
                        else {
                            customWhereQuery.push([`${rightExpression} is not null`]);
                        }
                    }
                }
                else {
                    if (operatorKey === OperationQuery.eq) {
                        typeormWhereQuery[key] = (0, typeorm_1.Equal)(innerValue);
                    }
                    else if (operatorKey === OperationQuery.neq) {
                        typeormWhereQuery[key] = (0, typeorm_1.Not)(innerValue);
                    }
                    else if (operatorKey === OperationQuery.lt) {
                        typeormWhereQuery[key] = (0, typeorm_1.LessThan)(innerValue);
                    }
                    else if (operatorKey === OperationQuery.lte) {
                        typeormWhereQuery[key] = (0, typeorm_1.LessThanOrEqual)(innerValue);
                    }
                    else if (operatorKey === OperationQuery.gt) {
                        typeormWhereQuery[key] = (0, typeorm_1.MoreThan)(innerValue);
                    }
                    else if (operatorKey === OperationQuery.gte) {
                        typeormWhereQuery[key] = (0, typeorm_1.MoreThanOrEqual)(innerValue);
                    }
                    else if (operatorKey === OperationQuery.like) {
                        typeormWhereQuery[key] = (0, typeorm_1.Like)(innerValue);
                    }
                    else if (operatorKey === OperationQuery.notlike) {
                        typeormWhereQuery[key] = (0, typeorm_1.Not)((0, typeorm_1.Like)(innerValue));
                    }
                    else if (operatorKey === OperationQuery.between) {
                        typeormWhereQuery[key] = (0, typeorm_1.Between)(innerValue[0], innerValue[1]);
                    }
                    else if (operatorKey === OperationQuery.notbetween) {
                        typeormWhereQuery[key] = (0, typeorm_1.Not)((0, typeorm_1.Between)(innerValue[0], innerValue[1]));
                    }
                    else if (operatorKey === OperationQuery.in) {
                        typeormWhereQuery[key] = (0, typeorm_1.In)(innerValue);
                    }
                    else if (operatorKey === OperationQuery.notin) {
                        typeormWhereQuery[key] = (0, typeorm_1.Not)((0, typeorm_1.In)(innerValue));
                    }
                    else if (operatorKey === "any") {
                        typeormWhereQuery[key] = (0, typeorm_1.Any)(innerValue);
                    }
                    else if (operatorKey === OperationQuery.null) {
                        if (innerValue === 'true') {
                            typeormWhereQuery[key] = (0, typeorm_1.IsNull)();
                        }
                        else {
                            typeormWhereQuery[key] = (0, typeorm_1.Not)((0, typeorm_1.IsNull)());
                        }
                    }
                }
            }
        }
    }
    return { typeormWhereQuery, customWhereQuery };
};
const compressFieldsName = (fields) => {
    if (!(fields === null || fields === void 0 ? void 0 : fields.length))
        return '';
    return convertArrayOfStringIntoStringNumber(fields.map(x => x.name));
};
const convertArrayOfStringIntoStringNumber = (array) => {
    if (!array.length)
        return '';
    const sortedArray = array.sort();
    const stringArray = Array.from(sortedArray.join(''));
    const charSum = stringArray.reduce((sum, x) => (sum + x.charCodeAt(0)), 0);
    return `${charSum}${stringArray.length}${sortedArray.length}`;
};
//# sourceMappingURL=filter.js.map