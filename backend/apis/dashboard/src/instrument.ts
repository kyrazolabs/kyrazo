import * as Sentry from '@sentry/bun';
import config from './configs/app';

Sentry.init({
    dsn: config.logging.sentry.dsn,
    debug: config.isProduction === false,
    environment: config.isDevelopment ? 'development' : 'production',
    sendDefaultPii: true,
});
