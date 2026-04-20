export interface IS3Bucket {
    id: string;
    name: string;
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
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
}

export interface UpdateS3Request extends Partial<CreateS3Request> {}
