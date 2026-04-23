export interface TransformerData {
    code: string;
    name?: string;
    description?: string;
}

export interface IASQSQueue {
    id: string;
    name: string;
    queueUrl: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    transformer?: string | TransformerData;
    isManagedTransform?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateASQSRequest {
    name: string;
    queueUrl: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    transformer?: string | TransformerData;
}

export interface UpdateASQSRequest extends Partial<CreateASQSRequest> {}
