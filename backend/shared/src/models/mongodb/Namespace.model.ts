import { Schema, model } from 'mongoose';
import { INamespace, INamespaceModel } from '../../types';
import { unprefixId } from '../../utils/id';

// Namespace schema
const NamespaceSchema = new Schema<INamespace>(
    {
        name: {
            type: String,
            required: [true, 'Namespace name is required'],
            trim: true,
            minlength: [2, 'Namespace name must be at least 2 characters long'],
            maxlength: [100, 'Namespace name cannot exceed 100 characters'],
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
        transformer: {
            type: Schema.Types.ObjectId,
            ref: 'Transform',
            default: null,
        },
        isManagedTransform: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `ns_${ret._id.toString()}`;
                delete (ret as any)._id;
                delete (ret as any).__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `ns_${ret._id.toString()}`;
                delete (ret as any)._id;
                delete (ret as any).__v;
                return ret;
            },
        },
    }
);

// Indexes
NamespaceSchema.index({ name: 1 });
NamespaceSchema.index({ workspaceId: 1 });
NamespaceSchema.index({ createBy: 1 });
NamespaceSchema.index({ isArchived: 1 });
NamespaceSchema.index({ isDeleted: 1 });
NamespaceSchema.index({ createdAt: -1 });
NamespaceSchema.index({ name: 'text', description: 'text' });

// Virtual fields
NamespaceSchema.virtual('creator', {
    ref: 'User',
    localField: 'createBy',
    foreignField: '_id',
    justOne: true,
});

NamespaceSchema.virtual('workspace', {
    ref: 'Workspace',
    localField: 'workspaceId',
    foreignField: '_id',
    justOne: true,
});

NamespaceSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'namespaceId',
});

// Instance methods
NamespaceSchema.methods.softDelete = async function (): Promise<INamespace> {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
};

NamespaceSchema.methods.restore = async function (): Promise<INamespace> {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
};

NamespaceSchema.methods.archive = async function (): Promise<INamespace> {
    this.isArchived = true;
    return this.save();
};

NamespaceSchema.methods.unarchive = async function (): Promise<INamespace> {
    this.isArchived = false;
    return this.save();
};

NamespaceSchema.methods.updateSettings = async function (settings: any): Promise<INamespace> {
    Object.assign(this.settings, settings);
    return this.save();
};

NamespaceSchema.methods.updateProgress = async function (newProgress: number): Promise<INamespace> {
    this.progress = newProgress;
    if (newProgress >= 100 && this.status !== 'completed') {
        this.status = 'completed';
    }
    return this.save();
};

NamespaceSchema.methods.isOverdue = function (): boolean {
    return this.deadline ? this.deadline < new Date() && this.status !== 'completed' : false;
};

// Static methods
NamespaceSchema.statics.findByOwner = function (userId: string) {
    return this.find({ createBy: unprefixId(userId), isDeleted: false });
};

NamespaceSchema.statics.findByWorkspace = function (workspaceId: string) {
    return this.find({ workspaceId: unprefixId(workspaceId), isDeleted: false });
};

NamespaceSchema.statics.findByWorkspaceAndNamespace = async function (
    workspaceId: string,
    namespaceId: string
) {
    return await this.findOne({
        _id: unprefixId(namespaceId),
        workspaceId: unprefixId(workspaceId),
        isDeleted: false,
    });
};

NamespaceSchema.statics.findPublic = function () {
    return this.find({ visibility: 'public', isDeleted: false });
};

NamespaceSchema.statics.searchNamespaces = function (query: string, limit: number = 10) {
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

NamespaceSchema.statics.getNamespaceStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalNamespaces: { $sum: 1 },
                activeNamespaces: {
                    $sum: { $cond: [{ $eq: ['$isDeleted', false] }, 1, 0] },
                },
                completedNamespaces: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                },
                archivedNamespaces: {
                    $sum: { $cond: [{ $eq: ['$isArchived', true] }, 1, 0] },
                },
                deletedNamespaces: {
                    $sum: { $cond: [{ $eq: ['$isDeleted', true] }, 1, 0] },
                },
            },
        },
        {
            $project: {
                _id: 0,
                totalNamespaces: 1,
                activeNamespaces: 1,
                completedNamespaces: 1,
                archivedNamespaces: 1,
                deletedNamespaces: 1,
            },
        },
    ] as any[]);

    return (
        stats[0] || {
            totalNamespaces: 0,
            activeNamespaces: 0,
            completedNamespaces: 0,
            archivedNamespaces: 0,
            deletedNamespaces: 0,
        }
    );
};

NamespaceSchema.statics.getStatusStats = async function () {
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

NamespaceSchema.statics.getRecentNamespaces = function (days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.find({
        createdAt: { $gte: startDate },
        isDeleted: false,
    }).sort({ createdAt: -1 });
};

NamespaceSchema.statics.findOverdue = function () {
    return this.find({
        deadline: { $lt: new Date() },
        status: { $ne: 'completed' },
        isDeleted: false,
    });
};

NamespaceSchema.statics.permanentlyDelete = function (namespaceId: string) {
    return this.findByIdAndDelete(unprefixId(namespaceId));
};

NamespaceSchema.statics.isUserOwner = async function (
    userId: string,
    namespaceId: string
): Promise<boolean> {
    const namespace = await this.findOne({
        _id: unprefixId(namespaceId),
        createBy: unprefixId(userId),
    });
    return !!namespace;
};

// Export the model
export const Namespace = model<INamespace, INamespaceModel>('Namespace', NamespaceSchema);
export default Namespace;
