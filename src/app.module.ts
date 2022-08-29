import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { TaskModule } from './entities/task/task.module';
import { UserModule } from './entities/user/user.module';
import { GraphqlModule } from './graphql.module';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    TaskModule,
    GraphqlModule,
  ],
})
export class AppModule {}
