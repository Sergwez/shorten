import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5433'),
      database: process.env.DATABASE_NAME || 'shorts_db',
      user: process.env.DATABASE_USER || 'shorts_user',
      password: process.env.DATABASE_PASSWORD || 'shorts_password'
    },
    migrations: {
      directory: './migrations',
      extension: 'ts'
    },
    seeds: {
      directory: './seeds'
    },
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN || '2'),
      max: parseInt(process.env.DATABASE_POOL_MAX || '10')
    }
  },

  test: {
    client: 'postgresql',
    connection: {
      host: process.env.TEST_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.TEST_DATABASE_PORT || '5433'),
      database: process.env.TEST_DATABASE_NAME || 'shorts_test_db',
      user: process.env.TEST_DATABASE_USER || 'shorts_user',
      password: process.env.TEST_DATABASE_PASSWORD || 'shorts_password'
    },
    migrations: {
      directory: './migrations',
      extension: 'ts'
    },
    pool: {
      min: 1,
      max: 5
    }
  },
  
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DATABASE_HOST || 'database',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'shorts_db',
      user: process.env.DATABASE_USER || 'shorts_user',
      password: process.env.DATABASE_PASSWORD || 'shorts_password'
    },
    migrations: {
      directory: './migrations',
      extension: 'ts'
    },
    pool: {
      min: parseInt(process.env.DATABASE_POOL_MIN || '5'),
      max: parseInt(process.env.DATABASE_POOL_MAX || '30'),
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    }
  }
};

export default config; 