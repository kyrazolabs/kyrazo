import { ZodSchema } from 'zod';
import type { ValidationTargets } from 'hono';
import { zValidator as zv } from '@hono/zod-validator';
import { IErrorResponse } from '@kyrazo/shared';

export const validate = <T extends ZodSchema, Target extends keyof ValidationTargets>(
    target: Target,
    schema: T
) =>
    zv(target, schema, (result, c) => {
        if (!result.success) {
            return c.json<IErrorResponse>(
                {
                    success: false,
                    error: {
                        code: 'BAD_REQUEST',
                        message: 'Validation Error',
                        details: JSON.parse(result.error.message).map((e: any) => ({
                            field: e.path.join('.') || 'unknown',
                            message: e.message,
                        })),
                        requestId: c.get('requestId'),
                    },
                },
                400
            );
        }
    });
