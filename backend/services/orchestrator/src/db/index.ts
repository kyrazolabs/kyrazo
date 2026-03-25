import mongoose from 'mongoose';
import { config } from '../common/config';

const connectionString = config.MONGODB_URI;

if (!connectionString) {
    throw new Error('MONGODB_URI is not defined');
}

export const connectDB = async () => {
    try {
        await mongoose.connect(connectionString, {
            autoIndex: true,
        });
        console.log('🚀 MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

export * from './models';
