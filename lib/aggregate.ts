import { BaseEntity } from "./common";

export const GraphqlAggregate = (baseEntity: () => BaseEntity) => {
  return (target, _property, descriptor) => {
    const actualDescriptor = descriptor.value;
    descriptor.value = function(...args) {
      return actualDescriptor.call(this, ...args);
    };
  };
};