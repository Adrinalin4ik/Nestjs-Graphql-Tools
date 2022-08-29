import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class DeleteDTO {
  @Field()
  id: number;
}
