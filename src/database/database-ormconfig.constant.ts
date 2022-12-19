import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';
import { seeds1671015219018 } from './migrations/1671015219018-seeds';
import { IDBSettings } from './settings.types';

const settings: IDBSettings = config.DB_SETTINGS;

export function getOrmConfig(): TypeOrmModuleOptions {
  let ormConfig: TypeOrmModuleOptions;
  if (process.env.NODE_ENV !== 'test') {
    ormConfig = {
      type: 'postgres',
      host: process.env.DB_HOST || settings.host,
      username: process.env.DB_USERNAME || settings.username,
      password: process.env.DB_PASSWORD || settings.password,
      logging: settings.logging,
      database: settings.database,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [seeds1671015219018],
      migrationsRun: true,
      // synchronize: settings.synchronize || false,
      extra: {
        connectionLimit: 15,
      },
    };
  } else {
    ormConfig = {
      type: 'sqlite',
      database: ':memory:',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [seeds1671015219018],
      migrationsRun: true,
      keepConnectionAlive: true,
      logging: settings.logging,
    };
  }
  return ormConfig;
}
