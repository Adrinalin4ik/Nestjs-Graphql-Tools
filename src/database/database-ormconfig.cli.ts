import { ConnectionOptions } from 'typeorm';

import { getOrmConfig } from './database-ormconfig.constant';

const database_connection_test_configuration: Partial<ConnectionOptions> = {
  ...getOrmConfig(),
};

export = database_connection_test_configuration;
