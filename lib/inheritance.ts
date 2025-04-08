/**
 * Decorator for marking a class as an inherited model in the GraphQL schema
 * This decorator adds an '__extension__' property to the class with its name,
 * which is used to identify inherited models in the GraphQL type system.
 * 
 * @returns {ClassDecorator} A class decorator that marks the class as an inherited model
 * 
 * @example
 * ```typescript
 * @InheritedModel()
 * class BaseModel {
 *   // Base model implementation
 * }
 * ```
 */
export const InheritedModel = () => {
  return (target) => {
    Object.defineProperty(target, '__extension__', {
      value: target.name
    });
    return target;
  }
}