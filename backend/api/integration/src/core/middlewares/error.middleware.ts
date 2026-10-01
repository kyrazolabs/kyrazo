import type { Next } from 'hono';
import type { Error } from 'hono-error-handler';
import { ZodError } from 'zod';
import type { AppContext } from './auth.middleware';

const handleMongooseErrors = (error: Error) => {
    // Mongoose bad ObjectId
    if (error.name === 'CastError') {
        return {
            success: false,
            statusCode: 404,
            errors: [
                {
                    field: error.path || 'id',
                    message: 'Resource not found',
                },
            ],
        };
    }

    // Mongoose duplicate key
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return {
            success: false,
            statusCode: 409,
            errors: [
                {
                    field,
                    message: `${field} is already registered`,
                },
            ],
        };
    }

    // Mongoose validation error
    if (error.name === 'ValidationError') {
        return {
            success: false,
            statusCode: 400,
            errors: Object.values(error.errors).map((val: any) => ({
                field: val.path,
                message: val.message,
            })),
        };
    }

    // أي خطأ عام
    return {
        success: false,
        statusCode: error.statusCode || 500,
        errors: [
            {
                field: 'unknown',
                message: error.message || 'Internal Server Error',
            },
        ],
    };
};

const zodErrorHandler = async (c: AppContext, next: Next) => {
    try {
        await next();
    } catch (err: any) {
        if (err instanceof ZodError) {
            return c.json(
                {
                    success: false,
                    statusCode: 400,
                    errors: err.issues.map((e: any) => ({
                        field: e.path.join('.') || 'unknown',
                        message: e.message,
                    })),
                },
                400
            );
        }
        throw err; // أي خطأ آخر نتركه لـ hono-error-handler العادي
    }
};

export { zodErrorHandler, handleMongooseErrors };
