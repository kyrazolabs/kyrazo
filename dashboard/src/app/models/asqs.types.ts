export interface IASQSQueue {
    id: string;
    name: string;
    queueUrl: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateASQSRequest {
    name: string;
    queueUrl: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
}

export interface UpdateASQSRequest extends Partial<CreateASQSRequest> {}
