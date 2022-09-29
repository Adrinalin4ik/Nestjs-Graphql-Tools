"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InheritedModel = void 0;
const InheritedModel = () => {
    return (target) => {
        Object.defineProperty(target, '__extension__', {
            value: target.name
        });
        return target;
    };
};
exports.InheritedModel = InheritedModel;
//# sourceMappingURL=inheritance.js.map