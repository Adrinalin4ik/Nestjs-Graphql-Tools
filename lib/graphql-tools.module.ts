import { Module, Global, Injectable, DynamicModule, Provider } from '@nestjs/common';
import { CacheInterceptor } from './caching';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Injectable()
export class GraphqlToolsConfig {}

export const GraphqlToolsConfigToken = 'GraphqlToolsConfigToken';

export interface IGraphqlToolsConfig {
  caching?: {
    enabled?: boolean;
    globalCaching: {
      queryCaching: boolean;
      resolveFieldCaching?: boolean;
    }
  }
}

@Global()
@Module({})
export class GraphqlToolsModule {
  static configure(config: IGraphqlToolsConfig): DynamicModule {
    const providers: Provider[] = [];
    const exportedModules = [];
    if (config.caching?.enabled) {
      if (config.caching?.globalCaching?.queryCaching) {
        providers.push({
          provide: APP_INTERCEPTOR,
          useClass: CacheInterceptor,
        });
      }
      
      exportedModules.push(CacheInterceptor);
      providers.push(CacheInterceptor);
      
    }
    const configProvider = {
      provide: GraphqlToolsConfigToken,
      useValue: config,
    };
    providers.push(configProvider)
    exportedModules.push(configProvider)

    return {
      module: GraphqlToolsModule,
      providers,
      exports: exportedModules,
      global: true,
    }
  }
}