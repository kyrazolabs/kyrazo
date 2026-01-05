import mongoose from 'mongoose';
import { Workspace } from '../models/mongodb/Workspace.model';

async function list() {
    try {
        const mongoUri =
            process.env.MONGODB_URI || 'mongodb://localhost:27017/kyrazo-test';
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Bypass middleware to see EVERYTHING
        const workspaces = await Workspace.find({}).setOptions({
            findDeleted: true,
        });
        console.log(`Total workspaces: ${workspaces.length}`);

        for (const workspace of workspaces) {
            console.log(
                `- ${workspace.name} (${workspace._id}): isDeleted=${workspace.isDeleted}, isArchived=${workspace.isArchived}`
            );
        }
    } catch (error) {
        console.error('Failed to list:', error);
    } finally {
        await mongoose.disconnect();
    }
}

list();
