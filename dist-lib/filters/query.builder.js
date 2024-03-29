"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFilterParameters = void 0;
const typeorm_1 = require("typeorm");
const functions_1 = require("../utils/functions");
const constants_1 = require("./constants");
const input_type_generator_1 = require("./input-type-generator");
const convertFilterParameters = (parameters, customFields, options) => {
    if (parameters === null || parameters === void 0 ? void 0 : parameters.whereFactory)
        return parameters;
    return new typeorm_1.Brackets((qb) => {
        if (parameters == null) {
            return;
        }
        const clonnedParams = Object.assign({}, parameters);
        delete clonnedParams.and;
        delete clonnedParams.or;
        if (parameters === null || parameters === void 0 ? void 0 : parameters.and) {
            qb.andWhere(new typeorm_1.Brackets((andBracketsQb) => {
                for (const op of parameters === null || parameters === void 0 ? void 0 : parameters.and) {
                    const andParameters = recursivelyTransformComparators(op, customFields, options === null || options === void 0 ? void 0 : options.sqlAlias);
                    if (andParameters === null || andParameters === void 0 ? void 0 : andParameters.length) {
                        for (const query of andParameters) {
                            andBracketsQb.andWhere(query[0], query[1]);
                        }
                    }
                }
            }));
        }
        if (parameters === null || parameters === void 0 ? void 0 : parameters.or) {
            qb.orWhere(new typeorm_1.Brackets((orBracketsQb) => {
                for (const op of parameters === null || parameters === void 0 ? void 0 : parameters.or) {
                    const orParameters = recursivelyTransformComparators(op, customFields, options === null || options === void 0 ? void 0 : options.sqlAlias);
                    if (orParameters === null || orParameters === void 0 ? void 0 : orParameters.length) {
                        for (const query of orParameters) {
                            orBracketsQb.orWhere(query[0], query[1]);
                        }
                    }
                }
            }));
        }
        const basicParameters = recursivelyTransformComparators(clonnedParams, customFields, options === null || options === void 0 ? void 0 : options.sqlAlias);
        if (basicParameters) {
            qb.andWhere(new typeorm_1.Brackets((basicParametersQb) => {
                for (const query of basicParameters) {
                    basicParametersQb.andWhere(query[0], query[1]);
                }
            }));
        }
    });
};
exports.convertFilterParameters = convertFilterParameters;
const recursivelyTransformComparators = (object, extendedParams, sqlAlias) => {
    if (!object || !Object.entries(object).length)
        return null;
    const typeormWhereQuery = [];
    for (const [key, value] of Object.entries(object)) {
        if (typeof value === "object") {
            const operators = Object.entries(value);
            if (operators.length > 1) {
                throw new Error('Inside filter statement should be only one condition operator for each attribute');
            }
            for (const [innerKey, innerValue] of operators) {
                const operatorKey = innerKey.replace(constants_1.FILTER_OPERATION_PREFIX, '');
                if (extendedParams.has(key)) {
                    const field = extendedParams.get(key);
                    const rightExpression = field.sqlExp ? field.sqlExp : (sqlAlias ? `${sqlAlias}.${field.name}` : field.name);
                    typeormWhereQuery.push(buildSqlArgument(operatorKey, rightExpression, innerValue));
                }
                else {
                    const rightExpression = sqlAlias ? `${sqlAlias}.${key}` : key;
                    typeormWhereQuery.push(buildSqlArgument(operatorKey, rightExpression, innerValue));
                }
            }
        }
    }
    return typeormWhereQuery;
};
const buildSqlArgument = (operatorKey, field, value) => {
    let result = [];
    const argName = `arg_${(0, functions_1.convertArrayOfStringIntoStringNumber)([field])}`;
    if (operatorKey === input_type_generator_1.OperationQuery.eq) {
        if (value === null || value === 'null') {
            result = [`${field} is null`];
        }
        else {
            result = [`${field} = :${argName}`, { [argName]: value }];
        }
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.neq) {
        if (value === null || value === 'null') {
            result = [`${field} != :${argName}`, { [argName]: value }];
        }
        else {
            result = [`${field} is not null`];
        }
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.lt) {
        result = [`${field} < :${argName}`, { [argName]: value }];
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.lte) {
        result = [`${field} <= :${argName}`, { [argName]: value }];
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.gt) {
        result = [`${field} > :${argName}`, { [argName]: value }];
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.gte) {
        result = [`${field} >= :${argName}`, { [argName]: value }];
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.like) {
        result = [`${field}::varchar ilike :${argName}::varchar`, { [argName]: value }];
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.notlike) {
        result = [`${field}::varchar not ilike :${argName}::varchar`, { [argName]: value }];
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.between) {
        result = [`${field} between :${argName}1 and :${argName}2`, { [`${argName}1`]: value[0], [`${argName}2`]: value[1] }];
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.notbetween) {
        result = [`${field} not between :${argName}1 and :${argName}2`, { [`${argName}1`]: value[0], [`${argName}2`]: value[1] }];
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.in) {
        result = [`${field} in (:...${argName})`, { [argName]: value }];
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.notin) {
        result = [`${field} not in (:...${argName})`, { [argName]: value }];
    }
    else if (operatorKey === "any") {
        result = [`${field} any (:${argName})`, { [argName]: value }];
    }
    else if (operatorKey === input_type_generator_1.OperationQuery.null) {
        if (value === 'true' || value === true) {
            result = [`${field} is null`];
        }
        else {
            result = [`${field} is not null`];
        }
    }
    return result;
};
//# sourceMappingURL=query.builder.js.map