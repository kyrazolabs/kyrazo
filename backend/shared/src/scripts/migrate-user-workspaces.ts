import { databaseConfig } from '../configs/mongo';
import { Workspace, UserWorkspace } from '../models/mongodb/Workspace.model';

async function migrate() {
    try {
        await databaseConfig.connect();
        console.log('Connected to MongoDB');

        // Find all deleted workspaces
        const deletedWorkspaces = await (Workspace as any)
            .find({ isDeleted: true })
            .setOptions({ findDeleted: true });
        console.log(`Found ${deletedWorkspaces.length} deleted workspaces`);

        for (const workspace of deletedWorkspaces) {
            const result = await (UserWorkspace as any)
                .updateMany(
                    { workspaceId: workspace._id },
                    {
                        isDeleted: true,
                        deletedAt: workspace.deletedAt || new Date(),
                    }
                )
                .setOptions({ findDeleted: true });
            console.log(
                `Updated ${result.modifiedCount} memberships for workspace ${workspace.name} (${workspace._id})`
            );
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await databaseConfig.disconnect();
    }
}

migrate();
