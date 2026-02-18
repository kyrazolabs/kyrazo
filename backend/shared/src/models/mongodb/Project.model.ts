import { Schema, model } from 'mongoose';
import { IProject, IProjectModel } from '../../types';
import { unprefixId } from '../../utils/id';

// Project schema
const ProjectSchema = new Schema<IProject>(
    {
        name: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
            minlength: [2, 'Project name must be at least 2 characters long'],
            maxlength: [100, 'Project name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            default: null,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: [true, 'Workspace ID is required'],
        },
        createBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        whiteLabelHeaders: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `pro_${ret._id.toString()}`;
                delete (ret as any)._id;
                delete (ret as any).__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `pro_${ret._id.toString()}`;
                delete (ret as any)._id;
                delete (ret as any).__v;
                return ret;
            },
        },
    }
);

// Indexes
ProjectSchema.index({ name: 1 });
ProjectSchema.index({ workspaceId: 1 });
ProjectSchema.index({ createBy: 1 });
ProjectSchema.index({ isArchived: 1 });
ProjectSchema.index({ isDeleted: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ name: 'text', description: 'text' });

// Virtual fields
ProjectSchema.virtual('creator', {
    ref: 'User',
    localField: 'createBy',
    foreignField: '_id',
    justOne: true,
});

ProjectSchema.virtual('workspace', {
    ref: 'Workspace',
    localField: 'workspaceId',
    foreignField: '_id',
    justOne: true,
});

ProjectSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'ProjectId',
});

// Instance methods
ProjectSchema.methods.softDelete = async function (): Promise<IProject> {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
};

ProjectSchema.methods.restore = async function (): Promise<IProject> {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
};

ProjectSchema.methods.archive = async function (): Promise<IProject> {
    this.isArchived = true;
    return this.save();
};

ProjectSchema.methods.unarchive = async function (): Promise<IProject> {
    this.isArchived = false;
    return this.save();
};

ProjectSchema.methods.updateSettings = async function (settings: any): Promise<IProject> {
    Object.assign(this.settings, settings);
    return this.save();
};

ProjectSchema.methods.updateProgress = async function (newProgress: number): Promise<IProject> {
    this.progress = newProgress;
    if (newProgress >= 100 && this.status !== 'completed') {
        this.status = 'completed';
    }
    return this.save();
};

ProjectSchema.methods.isOverdue = function (): boolean {
    return this.deadline ? this.deadline < new Date() && this.status !== 'completed' : false;
};

// Static methods
ProjectSchema.statics.findByOwner = function (ownerId: string) {
    return this.find({ ownerId, isDeleted: false });
};

ProjectSchema.statics.findByWorkspace = function (workspaceId: string) {
    return this.find({ workspaceId: unprefixId(workspaceId), isDeleted: false });
};

ProjectSchema.statics.findByWorkspaceAndProject = async function (
    workspaceId: string,
    projectId: string
) {
    return await this.findOne({
        _id: unprefixId(projectId),
        workspaceId: unprefixId(workspaceId),
        isDeleted: false,
    });
};

ProjectSchema.statics.findPublic = function () {
    return this.find({ visibility: 'public', isDeleted: false });
};

ProjectSchema.statics.searchProjects = function (query: string, limit: number = 10) {
    return this.find(
        {
            $text: { $search: query },
            isDeleted: false,
        },
        { score: { $meta: 'textScore' } }
    )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit);
};

ProjectSchema.statics.getProjectStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalProjects: { $sum: 1 },
                activeProjects: {
                    $sum: { $cond: [{ $eq: ['$isDeleted', false] }, 1, 0] },
                },
                completedProjects: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                archivedProjects: {
                    $sum: { $cond: [{ $eq: ['$isArchived', true] }, 1, 0] },
                },
                deletedProjects: {
                    $sum: { $cond: [{ $eq: ['$isDeleted', true] }, 1, 0] },
                },
            },
        },
        {
            $project: {
                _id: 0,
                totalProjects: 1,
                activeProjects: 1,
                completedProjects: 1,
                archivedProjects: 1,
                deletedProjects: 1,
            },
        },
    ]);

    return (
        stats[0] || {
            totalProjects: 0,
            activeProjects: 0,
            completedProjects: 0,
            archivedProjects: 0,
            deletedProjects: 0,
        }
    );
};

ProjectSchema.statics.getStatusStats = async function () {
    const stats = await this.aggregate([
        { $match: { isDeleted: false } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    const result: Record<string, number> = {
        planning: 0,
        active: 0,
        on_hold: 0,
        completed: 0,
        cancelled: 0,
    };
    stats.forEach(stat => {
        result[stat._id as string] = stat.count;
    });

    return result;
};

ProjectSchema.statics.getRecentProjects = function (days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.find({
        createdAt: { $gte: startDate },
        isDeleted: false,
    }).sort({ createdAt: -1 });
};

ProjectSchema.statics.findOverdue = function () {
    return this.find({
        deadline: { $lt: new Date() },
        status: { $ne: 'completed' },
        isDeleted: false,
    });
};

ProjectSchema.statics.permanentlyDelete = function (projectId: string) {
    return this.findByIdAndDelete(unprefixId(projectId));
};

ProjectSchema.statics.isUserOwner = async function (
    userId: string,
    projectId: string
): Promise<boolean> {
    const project = await this.findOne({
        _id: unprefixId(projectId),
        createBy: unprefixId(userId),
    });
    return !!project;
};

// Export the model
export const Project = model<IProject, IProjectModel>('Project', ProjectSchema);
export default Project;
