import z from 'zod';

const ingestSchema = z.object({
    service: z.string('Invalid service').min(5, 'Service is required'),
    IEId: z
        .string('Invalid Ingress Endpoint')
        .min(5, 'Ingress Endpoint is required'),
});

export type ingestInput = z.infer<typeof ingestSchema>;
