import { registerEnumType } from "@nestjs/graphql";

export enum ETest {
  Test1 = 'Test1',
  Test2 = 'Test2'
}

registerEnumType(ETest, {
  name: 'ETest',
});