import { envelop, useEngine, useSchema } from '@envelop/core';
import { GraphQLLiveDirective, useLiveQuery } from '@envelop/live-query';
import { YogaDriver, YogaDriverConfig } from '@graphql-yoga/nestjs';
import { InMemoryLiveQueryStore } from '@n1ru4l/in-memory-live-query-store';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { execute as graphq_execute, parse, specifiedRules, subscribe, validate } from 'graphql';
import { DatabaseModule } from './database/database.module';
import { StoryModule } from './entities/story/story.module';
import { TaskModule } from './entities/task/task.module';
import { UserModule } from './entities/user/user.module';

export const liveQueryStore = new InMemoryLiveQueryStore();

setInterval(() => {
  liveQueryStore.invalidate('users')
}, 100)

const liveQueryPlugin = useLiveQuery({ liveQueryStore })

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    TaskModule,
    StoryModule,
    // GraphqlModule,
    GraphQLModule.forRootAsync<YogaDriverConfig>({
      driver: YogaDriver,
      useFactory: () => {
        return {
          autoSchemaFile: 'schema.gql',
          plugins: [liveQueryPlugin],
          // installSubscriptionHandlers: true,
          // subscriptions: {
          //   "graphql-ws": true
          // },
          buildSchemaOptions: {
            directives: [GraphQLLiveDirective]
          },
          executor: async ({ document, operationName, request, schema, context }) => {
            console.log('here')
            const getEnveloped = envelop({
              plugins: [
                useEngine({ parse, validate, specifiedRules, execute: graphq_execute, subscribe }),
                useSchema(schema),
                liveQueryPlugin,
                /* other plugins */
              ]
            })
            const { execute, contextFactory } = getEnveloped({ req: request, ...context });
            const contextValue = await contextFactory();
            return execute({
              schema,
              document,
              contextValue,
              variableValues: request.variables,
              operationName,
            });
          },
        };
      },
    })
  ],
})
export class AppModule {}
