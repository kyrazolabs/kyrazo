import { z } from 'zod';
import { config as loadEnv } from 'dotenv';

loadEnv();

const envSchema = z.object({
    POSTGRES_URL: z.string().min(1, 'DATABASE_URL is required'),
    PORT: z
        .string()
        .transform(v => parseInt(v, 10))
        .default(3000),
    API_KEY_SECRET: z.string().optional(), // In case we use it later
    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development'),
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
