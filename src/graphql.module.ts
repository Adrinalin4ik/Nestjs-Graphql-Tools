import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable } from '@nestjs/common';
import {
  GqlOptionsFactory,
  GraphQLModule
} from '@nestjs/graphql';
import { join } from 'path';

@Injectable()
export class GraphqlOptions implements GqlOptionsFactory {
  public createGqlOptions(): ApolloDriverConfig {
    return {
      playground: true,
      path: '/graphql',
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
    };
  }
}

export const GraphqlModule = GraphQLModule.forRootAsync<ApolloDriverConfig>({
  driver: ApolloDriver,
  useClass: GraphqlOptions,
});
