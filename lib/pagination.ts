import { Args, Field, InputType, Int } from "@nestjs/graphql";

/**
 * Options for configuring the pagination decorator
 */
export interface PaginateDecoratorArgs {
  name?: string;
  nullable?: boolean;
}

/**
 * Input type for pagination arguments in GraphQL queries
 * @class PaginatorArgsDto
 */
@InputType()
class PaginatorArgsDto {
  @Field(() => Int, { defaultValue: 10 })
  per_page: number;
  
  @Field(() => Int, { defaultValue: 0 })
  page: number;
}

/**
 * Interface for pagination arguments
 */
export interface PaginatorArgs extends PaginatorArgsDto {}

/**
 * Decorator for adding pagination support to GraphQL resolvers
 * This decorator adds pagination arguments to the resolver method
 * 
 * @param {PaginateDecoratorArgs} [options] - Optional configuration for the pagination
 * @returns {ParameterDecorator} A parameter decorator that adds pagination arguments
 * 
 * @example
 * ```typescript
 * @Query(() => [User])
 * async getUsers(
 *   @Paginator() pagination: PaginatorArgs
 * ) {
 *   // Implementation with pagination
 * }
 * ```
 */
export const Paginator = (options?: PaginateDecoratorArgs) => {
  return (target, propertyName, paramIndex) => {
    Args({
      name: options?.name || 'paginate',
      nullable: options?.nullable !== undefined  ? options.nullable : true,
      type: () => PaginatorArgsDto,
    })(target, propertyName, paramIndex);
  }
}