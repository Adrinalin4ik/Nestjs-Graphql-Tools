import * as config from 'config';
import { DataSource } from 'typeorm';
import { seeds1671015219018 } from './src/database/migrations/1671015219018-seeds';
import { IDBSettings } from './src/database/settings.types';

const settings: IDBSettings = config.DB_SETTINGS;

 
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || settings.host,
  username: process.env.DB_USERNAME || settings.username,
  password: process.env.DB_PASSWORD || settings.password,
  logging: settings.logging,
  database: settings.database,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [seeds1671015219018],
  // migrationsRun: true,
  synchronize: settings.synchronize || false,
  extra: {
    connectionLimit: 15,
  },
});