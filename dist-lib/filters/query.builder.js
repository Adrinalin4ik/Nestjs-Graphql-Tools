"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFilterParameters = exports.EOperationType = void 0;
const typeorm_1 = require("typeorm");
const functions_1 = require("../utils/functions");
const constants_1 = require("./constants");
const input_type_generator_1 = require("./input-type-generator");
var EOperationType;
(function (EOperationType) {
    EOperationType[EOperationType["AND"] = 0] = "AND";
    EOperationType[EOperationType["OR"] = 1] = "OR";
})(EOperationType || (exports.EOperationType = EOperationType = {}));
const convertFilterParameters = (parameters, opType = EOperationType.AND, customFields, options) => {
    if (parameters === null || parameters === void 0 ? void 0 : parameters.whereFactory)
        return parameters;
    parameters = parameters.filter(x => x !== undefined);
    return new typeorm_1.Brackets((qb) => {
        if (parameters == null) {
            return;
        }
        for (const op of parameters) {
            if (op.and) {
                const innerBrackets = (0, exports.convertFilterParameters)(op.and, EOperationType.AND, customFields, options);
                if (innerBrackets instanceof typeorm_1.Brackets) {
                    qb.andWhere(innerBrackets);
                }
            }
            if (op.or) {
                const innerBrackets = (0, exports.convertFilterParameters)(op.or, EOperationType.OR, customFields, options);
                if (innerBrackets instanceof typeorm_1.Brackets) {
                    qb.orWhere(innerBrackets);
                }
            }
            const clonnedOp = Object.assign({}, op);
            delete clonnedOp.and;
            delete clonnedOp.or;
            const basicParameters = recursivelyTransformComparators(clonnedOp, customFields, options === null || options === void 0 ? void 0 : options.sqlAlias);
            if (basicParameters) {
                for (const query of basicParameters) {
                    if (opType === EOperationType.AND) {
                        qb.andWhere(query[0], query[1]);
                    }
                    else {
                        qb.orWhere(query[0], query[1]);
                    }
                }
            }
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
    const argName = `arg_${(0, functions_1.convertArrayOfStringIntoStringNumber)([field])}_${Math.floor(Math.random() * 1e6)}`;
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