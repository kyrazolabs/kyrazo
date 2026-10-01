/**
 * @title Config Index
 * @description Central export for all configuration modules (app, database, redis, nats).
 * @example
 * import { config, databaseConfig, redisConfig, natsConfig } from './configs';
 */
export { config, validateConfig } from './app.config';
export { databaseConfig } from '@kyrazo/shared';
export { redisConfig } from './redis.config';
