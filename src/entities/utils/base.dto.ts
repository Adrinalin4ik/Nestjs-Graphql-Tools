import { Field, Int, ObjectType } from '@nestjs/graphql';

const Inherit = () => {
  return (target) => {
    Object.defineProperty(target, '__extension__', {
      value: target.name
    });
    return target;
  }
}

@ObjectType()
@Inherit()
export class BaseDTO {
  @Field(() => Int)
  id: number;

  // Timestamps
  @Field(() => Date)
  created_at: Date;

  @Field(() => Date)
  updated_at: Date;
}
