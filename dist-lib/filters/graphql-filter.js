"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyFilterParameter = exports.GraphqlFilter = void 0;
const typeorm_1 = require("typeorm");
const constants_1 = require("./constants");
const filter_1 = require("./filter");
const utils_1 = require("./utils");
const GraphqlFilter = () => {
    return (target, property, descriptor) => {
        const actualDescriptor = descriptor.value;
        descriptor.value = function (...args) {
            (0, exports.applyFilterParameter)(args, target, property);
            return actualDescriptor.call(this, ...args);
        };
        Reflect.defineMetadata(constants_1.GRAPHQL_FILTER_DECORATOR_METADATA_KEY, '', target, property);
    };
};
exports.GraphqlFilter = GraphqlFilter;
const applyFilterParameter = (args, target, property) => {
    const filterArgIndex = args.findIndex(x => (x === null || x === void 0 ? void 0 : x._name_) === constants_1.FILTER_DECORATOR_NAME_METADATA_KEY);
    if (filterArgIndex != -1) {
        const customFields = Reflect.getMetadata(constants_1.FILTER_DECORATOR_CUSTOM_FIELDS_METADATA_KEY, target, property);
        args[filterArgIndex] = convertParameters(args[filterArgIndex], customFields);
    }
};
exports.applyFilterParameter = applyFilterParameter;
const convertParameters = (parameters, customFields) => {
    const obj = new typeorm_1.Brackets((qb) => {
        const clonnedParams = Object.assign({}, parameters);
        const extendedParams = customFields.reduce((acc, x) => {
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
                const operatorKey = innerKey.replace(constants_1.FILTER_OPERATION_PREFIX, '');
                if (extendedParams === null || extendedParams === void 0 ? void 0 : extendedParams[key]) {
                    const rightExpression = extendedParams[key].sqlExp;
                    const argName = `arg_${(0, utils_1.convertArrayOfStringIntoStringNumber)([rightExpression])}`;
                    if (operatorKey === filter_1.OperationQuery.eq) {
                        customWhereQuery.push([`${rightExpression} = :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.neq) {
                        customWhereQuery.push([`${rightExpression} != :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.lt) {
                        customWhereQuery.push([`${rightExpression} < :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.lte) {
                        customWhereQuery.push([`${rightExpression} <= :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.gt) {
                        customWhereQuery.push([`${rightExpression} > :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.gte) {
                        customWhereQuery.push([`${rightExpression} >= :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.like) {
                        customWhereQuery.push([`${rightExpression} ilike :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.notlike) {
                        customWhereQuery.push([`${rightExpression} not ilike :${argName}`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.between) {
                        customWhereQuery.push([`${rightExpression} between :${argName}1 and :${argName}2`, { [`${argName}1`]: innerValue[0], [`${argName}2`]: innerValue[1] }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.notbetween) {
                        customWhereQuery.push([`${rightExpression} not between :${argName}1 and :${argName}2`, { [`${argName}1`]: innerValue[0], [`${argName}2`]: innerValue[1] }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.in) {
                        customWhereQuery.push([`${rightExpression} in (:...${argName})`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.notin) {
                        customWhereQuery.push([`${rightExpression} not in (:...${argName})`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === "any") {
                        customWhereQuery.push([`${rightExpression} any (:${argName})`, { [argName]: innerValue }]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.null) {
                        if (innerValue === 'true') {
                            customWhereQuery.push([`${rightExpression} is null`]);
                        }
                        else {
                            customWhereQuery.push([`${rightExpression} is not null`]);
                        }
                    }
                }
                else {
                    if (operatorKey === filter_1.OperationQuery.eq) {
                        typeormWhereQuery[key] = (0, typeorm_1.Equal)(innerValue);
                    }
                    else if (operatorKey === filter_1.OperationQuery.neq) {
                        typeormWhereQuery[key] = (0, typeorm_1.Not)(innerValue);
                    }
                    else if (operatorKey === filter_1.OperationQuery.lt) {
                        typeormWhereQuery[key] = (0, typeorm_1.LessThan)(innerValue);
                    }
                    else if (operatorKey === filter_1.OperationQuery.lte) {
                        typeormWhereQuery[key] = (0, typeorm_1.LessThanOrEqual)(innerValue);
                    }
                    else if (operatorKey === filter_1.OperationQuery.gt) {
                        typeormWhereQuery[key] = (0, typeorm_1.MoreThan)(innerValue);
                    }
                    else if (operatorKey === filter_1.OperationQuery.gte) {
                        typeormWhereQuery[key] = (0, typeorm_1.MoreThanOrEqual)(innerValue);
                    }
                    else if (operatorKey === filter_1.OperationQuery.like) {
                        typeormWhereQuery[key] = (0, typeorm_1.Like)(innerValue);
                    }
                    else if (operatorKey === filter_1.OperationQuery.notlike) {
                        typeormWhereQuery[key] = (0, typeorm_1.Not)((0, typeorm_1.Like)(innerValue));
                    }
                    else if (operatorKey === filter_1.OperationQuery.between) {
                        typeormWhereQuery[key] = (0, typeorm_1.Between)(innerValue[0], innerValue[1]);
                    }
                    else if (operatorKey === filter_1.OperationQuery.notbetween) {
                        typeormWhereQuery[key] = (0, typeorm_1.Not)((0, typeorm_1.Between)(innerValue[0], innerValue[1]));
                    }
                    else if (operatorKey === filter_1.OperationQuery.in) {
                        typeormWhereQuery[key] = (0, typeorm_1.In)(innerValue);
                    }
                    else if (operatorKey === filter_1.OperationQuery.notin) {
                        typeormWhereQuery[key] = (0, typeorm_1.Not)((0, typeorm_1.In)(innerValue));
                    }
                    else if (operatorKey === "any") {
                        typeormWhereQuery[key] = (0, typeorm_1.Any)(innerValue);
                    }
                    else if (operatorKey === filter_1.OperationQuery.null) {
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
//# sourceMappingURL=graphql-filter.js.map