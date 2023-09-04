import { Args, Field, InputType, Int } from "@nestjs/graphql";

export interface PaginateDecoratorArgs {
  name?: string;
  nullable?: boolean;
}

@InputType()
class PaginatorArgsDto {
  @Field(() => Int, { defaultValue: 10 })
  per_page: number;
  
  @Field(() => Int, { defaultValue: 0 })
  page: number;
}

export interface PaginatorArgs extends PaginatorArgsDto {}

export const Paginator = (options?: PaginateDecoratorArgs) => {
  return (target, propertyName, paramIndex) => {
    Args({
      name: options?.name || 'paginate',
      nullable: options?.nullable !== undefined  ? options.nullable : true,
      type: () => PaginatorArgsDto,
    })(target, propertyName, paramIndex);
  }
}