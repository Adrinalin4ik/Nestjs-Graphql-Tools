import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { StoryModule } from './entities/story/story.module';
import { TaskModule } from './entities/task/task.module';
import { UserModule } from './entities/user/user.module';
import { GraphqlModule } from './graphql.module';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    TaskModule,
    StoryModule,
    GraphqlModule,
  ],
})
export class AppModule {}
