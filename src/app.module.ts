import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { GraphqlToolsModule } from '../lib';
import { DatabaseModule } from './database/database.module';
import { StoryModule } from './entities/story/story.module';
import { TaskModule } from './entities/task/task.module';
import { UserModule } from './entities/user/user.module';
import { GraphqlModule } from './graphql.module';
@Module({
  imports: [
    DatabaseModule,
    CacheModule.register({
      isGlobal: true
    }),
    UserModule,
    TaskModule,
    StoryModule,
    GraphqlModule,
    GraphqlToolsModule.configure({
      caching: {
        enabled: true,
        globalCaching: {
          queryCaching: true,
          resolveFieldCaching: true
        }
      },
    }),
  ],
})
export class AppModule {}
