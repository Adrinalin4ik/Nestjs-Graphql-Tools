import { BaseEntity } from "./common";

/**
 * A decorator that enables GraphQL aggregation functionality for a method.
 * This decorator is used to mark methods that should handle GraphQL aggregation operations.
 * 
 * @param {() => BaseEntity} baseEntity - A function that returns the base entity type
 * @returns {MethodDecorator} A method decorator that preserves the original method's functionality
 * 
 * @example
 * ```typescript
 * @GraphqlAggregate(() => User)
 * async aggregateUsers() {
 *   // aggregation logic here
 * }
 * ```
 */
export const GraphqlAggregate = (baseEntity: () => BaseEntity) => {
  return (target, _property, descriptor) => {
    const actualDescriptor = descriptor.value;
    descriptor.value = function(...args) {
      return actualDescriptor.call(this, ...args);
    };
  };
};