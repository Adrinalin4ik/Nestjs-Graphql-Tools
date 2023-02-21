import { envelop, useEngine } from '@envelop/core';
import { createInMemoryCache, useResponseCache } from '@envelop/response-cache';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable } from '@nestjs/common';
import {
  GqlOptionsFactory,
  GraphQLModule
} from '@nestjs/graphql';
import { execute as graphq_execute, parse, specifiedRules, subscribe, validate } from 'graphql';
import { join } from 'path';

const cache = createInMemoryCache()

const getEnveloped = envelop({
  plugins: [
    useEngine({ parse, validate, specifiedRules, execute: graphq_execute, subscribe }),
    useResponseCache({
      // use global cache for all operations
      invalidateViaMutation: false,
      ttl: 2000,
      cache,
      session: () => null
    })
  ]
})

@Injectable()
export class GraphqlOptions implements GqlOptionsFactory {
  public createGqlOptions(): ApolloDriverConfig {
    return {
      debug: true,
      playground: true,
      path: '/graphql',
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      executor: async ({ document, operationName, request, schema, context }) => {
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
  }
}

export const GraphqlModule = GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  useClass: GraphqlOptions,
});
