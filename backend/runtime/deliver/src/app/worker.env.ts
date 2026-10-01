import * as dotenv from 'dotenv';
dotenv.config();

const requiredEnvVars = [
    'WORKER_CONCURRENCY',
    'MONGODB_URI',
    'MONGODB_DB_NAME',
    'REDIS_URL',
    'QUEUE_REDIS_URL',
    'STREAM_REDIS_URL',
    'ENCRYPTION_KEY',
];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const worker = {
    CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY!),
};

export const env = { worker };
