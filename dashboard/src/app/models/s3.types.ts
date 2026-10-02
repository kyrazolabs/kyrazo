export interface TransformerData {
    code: string;
    name?: string;
    description?: string;
}

export interface IS3Bucket {
    id: string;
    name: string;
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    transformer?: string | TransformerData;
    isManagedTransform?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateS3Request {
    name: string;
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    transformer?: string | TransformerData;
}

export interface UpdateS3Request extends Partial<CreateS3Request> {}
