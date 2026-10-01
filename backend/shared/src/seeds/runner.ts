import { databaseConfig } from '../configs/mongo';
import { seedPlans } from './seeders/plans.seeder';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct location depending on how it's called
// We try to find the nearest .env file
dotenv.config();

async function runSeeds() {
    try {
        console.log('--- Starting Database Seeding ---');
        
        console.log('Connecting to MongoDB...');
        await databaseConfig.connect();
        
        // Orchestrate seeders
        await seedPlans();
        
        // Add more seeders here as the system grows
        // await seedDefaultUsers();
        // await seedSystemSettings();
        
        console.log('--- Seeding Completed Successfully ---');
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        await databaseConfig.disconnect();
        process.exit(0);
    }
}

runSeeds();
