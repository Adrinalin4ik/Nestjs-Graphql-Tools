import { Args, Field, InputType } from "@nestjs/graphql";

export interface PaginateDecoratorArgs {
  name?: string;
  nullable?: boolean;
}

@InputType()
export class PaginatorArgs {
  @Field({ defaultValue: 10 })
  per_page: number;
  
  @Field({ defaultValue: 0 })
  page: number;
}

export const Paginator = (options?: PaginateDecoratorArgs) => {
  return (target, propertyName, paramIndex) => {
    Args({
      name: options?.name || 'paginate',
      nullable: options?.nullable !== undefined  ? options.nullable : true,
      type: () => PaginatorArgs,
    })(target, propertyName, paramIndex);
  }
}