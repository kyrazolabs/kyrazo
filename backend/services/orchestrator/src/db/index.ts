import { databaseConfig } from '@kyrazo/shared';

export const connectDB = async () => {
    try {
        await databaseConfig.connect();
        console.log('🚀 MongoDB (Shared) connected successfully');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

export * from '@kyrazo/shared';
