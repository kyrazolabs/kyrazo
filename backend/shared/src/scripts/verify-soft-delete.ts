import mongoose from 'mongoose';
import { Workspace } from '../models/mongodb/Workspace.model';

async function verify() {
    try {
        // Connect to local mongo or a mock
        const mongoUri =
            process.env.MONGODB_URI ||
            'mongodb+srv://nxion:Y1yiAjRIVUsut7Zh@cluster0.ot8uskd.mongodb.net/';
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // 1. Create a workspace
        const name = 'Test Workspace ' + Date.now();
        const workspace = await Workspace.create({
            name,
            ownerId: new mongoose.Types.ObjectId(),
            isDeleted: false,
        });
        console.log('Created workspace:', workspace._id);

        // 2. Verify find() returns it
        let found = await Workspace.findOne({ _id: workspace._id });
        console.log('Found BEFORE delete:', !!found);

        // 3. Soft delete
        await workspace.softDelete();
        console.log('Soft deleted workspace');

        // 4. Verify find() does NOT return it
        found = await Workspace.findOne({ _id: workspace._id });
        console.log('Found AFTER delete (regular find):', !!found);

        // 5. Verify findDeleted() returns it
        const deletedWorkspaces = await Workspace.findDeleted();
        const foundInDeleted = deletedWorkspaces.some(
            w => w._id.toString() === workspace._id.toString()
        );
        console.log('Found in Workspace.findDeleted():', foundInDeleted);

        // 6. Verify find() with option returns it
        const foundWithOption = await Workspace.findOne({
            _id: workspace._id,
        }).setOptions({ findDeleted: true });
        console.log(
            'Found AFTER delete (with findDeleted option):',
            !!foundWithOption
        );

        // 7. Clean up
        await Workspace.deleteOne({ _id: workspace._id });
        console.log('Cleaned up');
    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
