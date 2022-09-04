"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphqlAggregate = void 0;
const GraphqlAggregate = (baseEntity) => {
    return (target, _property, descriptor) => {
        const actualDescriptor = descriptor.value;
        descriptor.value = function (...args) {
            return actualDescriptor.call(this, ...args);
        };
    };
};
exports.GraphqlAggregate = GraphqlAggregate;
//# sourceMappingURL=aggregate.js.map