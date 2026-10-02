import z from 'zod';

const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');
export const sourceStatus = z.enum(['active', 'inactive']);
export const sourceType = z.enum(
    ['publish', 'receive', 'forward'],
    'Invalid sourceType'
);
export const sourceService = z.enum(['general', 'paypal'], 'Invalid service');

export const sourceAuthType = z.enum([
    'service',
    // "hmac",
    'api_key',
    'basic_auth',
]);
export const sourceAuthHmacAlgorithm = z.enum([
    'sha1',
    'sha256',
    'sha512',
    'md5',
]);
export const sourceAuthHmacEncoding = z.enum(['base64', 'base64url', 'hex']);

export const CreatePublishedSourceSchema = z.object({
    name: z
        .string()
        .min(3, 'Name must be at least 3 characters long')
        .max(100, 'Name must be at most 100 characters long'),

    description: z
        .string()
        .max(500, 'Description must be at most 500 characters')
        .optional(),

    type: z.enum(['publish']).default('publish'),
    status: sourceStatus.default('active'),

    eventTypes: z
        .array(
            z
                .string()
                .min(3, 'Each event type must be at least 3 characters long')
                .max(100, 'Each event type must be at most 100 characters long')
        )
        .optional()
        .default([]),

    retryPolicy: z.object({
        maxAttempts: z.number().min(1).max(10).default(3),
    }),
});

export const CreateReceivedSourceSchema = z
    .object({
        name: z
            .string()
            .min(3, 'Name must be at least 3 characters long')
            .max(100, 'Name must be at most 100 characters long'),

        description: z
            .string()
            .max(500, 'Description must be at most 500 characters')
            .optional(),

        type: z.enum(['receive']).default('receive'),
        service: sourceService,
        status: sourceStatus.default('active'),

        forwarding: z.boolean().default(false),
        endpoints: z.array(objectIdSchema).optional(),

        eventTypes: z
            .array(
                z
                    .string()
                    .min(
                        3,
                        'Each event type must be at least 3 characters long'
                    )
                    .max(
                        100,
                        'Each event type must be at most 100 characters long'
                    )
            )
            .optional()
            .default([]),

        retryPolicy: z
            .object({
                maxAttempts: z.number().min(1).max(10).default(3),
            })
            .optional(),
        authentication: z
            .object({
                enabled: z.boolean().default(false),
                type: sourceAuthType.optional(),
                service: z
                    .object({
                        secret: z
                            .string()
                            .min(
                                3,
                                'Signing secret must be at least 3 characters'
                            )
                            .max(
                                250,
                                'Signing secret must be at most 250 characters'
                            ),
                    })
                    .optional(),
                // hmac: z
                //     .object({
                //         algorithm: sourceAuthHmacAlgorithm,
                //         encoding: sourceAuthHmacEncoding,
                //         signatureHeaderKey: z
                //             .string()
                //             .min(
                //                 3,
                //                 "Signature header key must be at least 3 characters"
                //             )
                //             .max(
                //                 50,
                //                 "Signature header key must be at most 50 characters"
                //             ),
                //         signingSecret: z
                //             .string()
                //             .min(3, "Signing secret must be at least 3 characters")
                //             .max(
                //                 250,
                //                 "Signing secret must be at most 250 characters"
                //             ),
                //     })
                //     .optional(),
                basicAuth: z
                    .object({
                        username: z
                            .string()
                            .nonempty("Username mustn't be empty"),
                        password: z
                            .string()
                            .nonempty("password mustn't be empty"),
                    })
                    .optional(),
                apiKey: z
                    .object({
                        headerKey: z
                            .string()
                            .min(3, 'Header key must be at least 3 characters')
                            .max(
                                50,
                                'Header key must be at most 50 characters'
                            ),
                        apiKey: z
                            .string()
                            .min(3, 'API key must be at least 3 characters')
                            .max(250, 'API key must be at most 250 characters'),
                    })
                    .optional(),
            })
            .optional(),
    })
    .superRefine((data: any, ctx: any) => {
        const usedTypes = [
            data.authentication?.service,
            // data.authentication?.hmac,
            data.authentication?.apiKey,
            data.authentication?.basicAuth,
        ].filter(Boolean);
        if (usedTypes.length > 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['authentication'],
                message: 'Only one authentication type can be used at a time',
            });
        }

        if (usedTypes.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['authentication.type'],
                message: 'Authentication type must be specified',
            });
        }
        if (data.service === 'general') {
            // General service: must use api_key or basic_auth (HMAC temporarily disabled)
            if (!data.authentication?.enabled) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['authentication.type'],
                    message: 'Authentication is required for receive sources.',
                });
            } else if (
                !['api_key', 'basic_auth'].includes(data.authentication.type!)
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['authentication.type'],
                    message:
                        'General service receive sources must use api_key or basic_auth authentication (HMAC temporarily disabled).',
                });
            }
        } else {
            // Other services (e.g., paypal): must use service authentication
            if (!data.authentication?.enabled) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['authentication.type'],
                    message: 'Authentication is required for receive sources.',
                });
            } else if (
                data.authentication.type !== 'service' ||
                !data.authentication.service?.secret
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['authentication.service.secret'],
                    message:
                        "Service-specific receive sources must use 'service' authentication with a secret.",
                });
            }
        }

        // Removed contradictory authentication requirements
        // Authentication requirements are now handled above based on source type and service
        if (data.authentication?.enabled && !data.authentication?.type) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['authentication.type'],
                message:
                    'Authentication type is required when authentication is enabled.',
            });
        }

        if (
            data.authentication?.type === 'service' &&
            !data.authentication?.service
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['authentication.hmac'],
                message: "HMAC configuration is required when type is 'hmac'.",
            });
        }

        // if (data.authentication?.type === "hmac" && !data.authentication?.hmac) {
        //     ctx.addIssue({
        //         code: z.ZodIssueCode.custom,
        //         path: ["authentication.hmac"],
        //         message: "HMAC configuration is required when type is 'hmac'.",
        //     });
        // }

        if (
            data.authentication?.type === 'api_key' &&
            !data.authentication?.apiKey
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['authentication.apiKey'],
                message:
                    "API key configuration is required when type is 'api_key'.",
            });
        }

        if (
            data.authentication?.type === 'basic_auth' &&
            !data.authentication?.basicAuth
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['authentication.basicAuth'],
                message:
                    "Basic Auth configuration is required when type is 'basic_auth'.",
            });
        }
    });

export const CreateForwardedSourceSchema = z
    .object({
        name: z
            .string()
            .min(3, 'Name must be at least 3 characters long')
            .max(100, 'Name must be at most 100 characters long'),

        description: z
            .string()
            .max(500, 'Description must be at most 500 characters')
            .optional(),

        type: z.enum(['forward']).default('forward'),
        service: sourceService,
        status: sourceStatus.default('active'),

        endpoints: z.array(objectIdSchema).optional(),

        eventTypes: z
            .array(
                z
                    .string()
                    .min(
                        3,
                        'Each event type must be at least 3 characters long'
                    )
                    .max(
                        100,
                        'Each event type must be at most 100 characters long'
                    )
            )
            .default([]),

        retryPolicy: z
            .object({
                maxAttempts: z.number().min(1).max(10).default(3),
            })
            .optional(),
        authentication: z
            .object({
                enabled: z.boolean().default(false),
                type: sourceAuthType.optional(),
                service: z
                    .object({
                        secret: z
                            .string()
                            .min(
                                3,
                                'Signing secret must be at least 3 characters'
                            )
                            .max(
                                250,
                                'Signing secret must be at most 250 characters'
                            ),
                    })
                    .optional(),
                // hmac: z
                //     .object({
                //         algorithm: sourceAuthHmacAlgorithm,
                //         encoding: sourceAuthHmacEncoding,
                //         signatureHeaderKey: z
                //             .string()
                //             .min(
                //                 3,
                //                 "Signature header key must be at least 3 characters"
                //             )
                //             .max(
                //                 50,
                //                 "Signature header key must be at most 50 characters"
                //             ),
                //         signingSecret: z
                //             .string()
                //             .min(3, "Signing secret must be at least 3 characters")
                //             .max(
                //                 250,
                //                 "Signing secret must be at most 250 characters"
                //             ),
                //     })
                //     .optional(),
                basicAuth: z
                    .object({
                        username: z
                            .string()
                            .nonempty("Username mustn't be empty"),
                        password: z
                            .string()
                            .nonempty("password mustn't be empty"),
                    })
                    .optional(),
                apiKey: z
                    .object({
                        headerKey: z
                            .string()
                            .min(3, 'Header key must be at least 3 characters')
                            .max(
                                50,
                                'Header key must be at most 50 characters'
                            ),
                        apiKey: z
                            .string()
                            .min(3, 'API key must be at least 3 characters')
                            .max(250, 'API key must be at most 250 characters'),
                    })
                    .optional(),
            })
            .default({
                enabled: false,
                type: undefined,
            }),
    })
    .superRefine((data: any, ctx: any) => {
        const usedTypes = [
            data.authentication?.service,
            // data.authentication?.hmac,
            data.authentication?.apiKey,
            data.authentication?.basicAuth,
        ].filter(Boolean);
        if (usedTypes.length > 1) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['authentication'],
                message: 'Only one authentication type can be used at a time',
            });
        }

        // "forward" type: Authentication optional, but endpoints required
        if (data.type === 'forward') {
            if (!data.endpoints || data.endpoints.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['endpoints'],
                    message: 'Endpoints are required for forward sources.',
                });
            }
            // Authentication is optional for forward type - no validation needed
        }
        // Removed contradictory authentication requirements
        // Authentication requirements are now handled above based on source type and service
        if (data.authentication?.enabled && !data.authentication?.type) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['authentication.type'],
                message:
                    'Authentication type is required when authentication is enabled.',
            });
        }

        if (
            data.authentication?.type === 'service' &&
            !data.authentication?.service
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['authentication.service'],
                message:
                    "Service configuration is required when type is 'service'.",
            });
        }

        // if (data.authentication?.type === "hmac" && !data.authentication?.hmac) {
        //     ctx.addIssue({
        //         code: z.ZodIssueCode.custom,
        //         path: ["authentication.hmac"],
        //         message: "HMAC configuration is required when type is 'hmac'.",
        //     });
        // }

        if (
            data.authentication?.type === 'api_key' &&
            !data.authentication?.apiKey
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['authentication.apiKey'],
                message:
                    "API key configuration is required when type is 'api_key'.",
            });
        }

        if (
            data.authentication?.type === 'basic_auth' &&
            !data.authentication?.basicAuth
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['authentication.basicAuth'],
                message:
                    "Basic Auth configuration is required when type is 'basic_auth'.",
            });
        }
    });

export const UpdatePublishedSourceSchema =
    CreatePublishedSourceSchema.partial();
export const UpdateReceivedSourceSchema = CreateReceivedSourceSchema.omit({
    authentication: true,
}).partial();
export const UpdateForwardedSourceSchema = CreateForwardedSourceSchema.omit({
    authentication: true,
}).partial();

export const GetSourceByIdSchema = z.object({
    sourceId: objectIdSchema,
});
export const SearchSourceSchema = z.object({
    q: z
        .string()
        .min(3, 'Query must be at least 3 characters')
        .max(100, 'Query must be at most 100 characters')
        .optional(),
    status: sourceStatus.optional(),
    tags: z
        .string()
        .min(3, 'Tags must be at least 3 characters')
        .max(100, 'Tags must be at most 100 characters')
        .optional(),
    limit: z.coerce.number().min(1).max(100).default(10),
    page: z.coerce.number().min(1).default(1),
});

export type SourceService = z.infer<typeof sourceService>;
export type SourceType = z.infer<typeof sourceType>;
export type SourceStatus = z.infer<typeof sourceStatus>;

export type SourceAuthType = z.infer<typeof sourceAuthType>;
export type SourceAuthHmacAlgorithm = z.infer<typeof sourceAuthHmacAlgorithm>;
export type SourceAuthHmacEncoding = z.infer<typeof sourceAuthHmacEncoding>;

export type CreatePublishedSourceInput = z.infer<
    typeof CreatePublishedSourceSchema
>;
export type CreateReceivedSourceInput = z.infer<
    typeof CreateReceivedSourceSchema
>;
export type CreateForwardedSourceInput = z.infer<
    typeof CreateForwardedSourceSchema
>;

export type UpdatePublishedSourceInput = z.infer<
    typeof UpdatePublishedSourceSchema
>;
export type UpdateReceivedSourceInput = z.infer<
    typeof UpdateReceivedSourceSchema
>;
export type UpdateForwardedSourceInput = z.infer<
    typeof UpdateForwardedSourceSchema
>;

export type GetSourceByIdInput = z.infer<typeof GetSourceByIdSchema>;
export type FilterSourcesInput = z.infer<typeof SearchSourceSchema>;
