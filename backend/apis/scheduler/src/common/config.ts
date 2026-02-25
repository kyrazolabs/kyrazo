import { z } from 'zod';
import { config as loadEnv } from 'dotenv';

loadEnv();

const envSchema = z.object({
    POSTGRES_URL: z.string().min(1, 'DATABASE_URL is required'),
    PORT: z
        .string()
        .transform(v => parseInt(v, 10))
        .default(3000),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    COOLIFY_API_URL: z.string().default('https://coolify.io/api/v1'),
    COOLIFY_API_TOKEN: z.string().min(1, 'COOLIFY_API_TOKEN is required'),
    COOLIFY_GITHUB_APP_UUID: z.string().min(1, 'COOLIFY_GITHUB_APP_UUID is required'),
    COOLIFY_REPOSITORY: z.string().default('nxion/kyrazo-worker'),
    COOLIFY_BRANCH: z.string().default('main'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error(
        '❌ Invalid environment variables:',
        JSON.stringify(parsed.error.format(), null, 2)
    );
    process.exit(1);
}

export const config = parsed.data;
