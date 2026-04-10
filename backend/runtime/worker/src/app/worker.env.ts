import * as dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = [
    "WORKSPACE_ID",
    "WORKER_CONCURRENCY",
    "BATCH_SIZE",
    "MAX_ACK_PENDING",
    "FETCH_TIMEOUT_MS",
];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(
        `Missing required environment variables: ${missingEnvVars.join(", ")}`,
    );
}

const worker = {
    WORKSPACE_ID: process.env.WORKSPACE_ID,
    CONCURRENCY: parseInt(process.env.WORKER_CONCURRENCY!),
    BATCH_SIZE: parseInt(process.env.BATCH_SIZE!),
    MAX_ACK_PENDING: parseInt(process.env.MAX_ACK_PENDING!),
    FETCH_TIMEOUT_MS: parseInt(process.env.FETCH_TIMEOUT_MS!),
    PLAN_SLUG: process.env.PLAN_SLUG || 'free',
    WORKER_ID: process.env.WORKER_ID || process.env.COOLIFY_RESOURCE_UUID,
    VERSION: process.env.APP_VERSION,
    PURGE_CONFLICTS: process.env.NATS_PURGE_CONFLICTS === 'true',
};

export const env = { worker };
