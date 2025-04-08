/**
 * Base interface for GraphQL entities in the system.
 * This interface extends Function to allow for class constructor typing
 * and provides a flexible structure for entity definitions.
 * 
 * @interface BaseEntity
 * @extends {Function}
 * 
 * @property {new (...any: any[]): any} constructor - Constructor signature for the entity
 * @property {any} [key: string] - Index signature allowing for dynamic property access
 */
export interface BaseEntity extends Function {
  new (...any: any[]): any;
  [key: string]: any;
}