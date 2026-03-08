import { Model, Schema, Types, model } from 'mongoose';
import { IWorkspace, IWorkspaceModel, IUserWorkspace, WorkspaceRole } from '../../types';
import User from './User.model';
import { unprefixId } from '../../utils/id';

// Workspace schema

interface UserWorkspaceModel extends Model<IUserWorkspace> {
    findByUser(userId: string): Promise<IUserWorkspace[]>;
    findByWorkspace(workspaceId: string): Promise<IUserWorkspace[]>;
    findByUserAndWorkspace(userId: string, workspaceId: string): Promise<IUserWorkspace | null>;
    findByEmailAndWorkspace(email: string, workspaceId: string): Promise<IUserWorkspace | null>;
    findOwner(workspaceId: string): Promise<IUserWorkspace | null>;
    findAdmins(workspaceId: string): Promise<IUserWorkspace[]>;
    findByRole(workspaceId: string, role: WorkspaceRole): Promise<IUserWorkspace[]>;
    getUserRole(userId: string, workspaceId: string): Promise<WorkspaceRole | null>;
    isUserMember(userId: string, workspaceId: string): Promise<boolean>;
    isUserOwner(userId: string, workspaceId: string): Promise<boolean>;
    isUserAdmin(userId: string, workspaceId: string): Promise<boolean>;
    getMemberCount(workspaceId: string): Promise<number>;
    getRoleStats(workspaceId: string): Promise<Record<WorkspaceRole, number>>;
    getRecentMembers(workspaceId: string, days?: number): Promise<IUserWorkspace[]>;
    getPendingInvitations(workspaceId: string): Promise<IUserWorkspace[]>;
}

const workspaceSchema = new Schema<IWorkspace>(
    {
        name: {
            type: String,
            required: [true, 'Workspace name is required'],
            trim: true,
            minlength: [2, 'Workspace name must be at least 2 characters long'],
            maxlength: [100, 'Workspace name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            default: null,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        avatar: {
            type: String,
            default: null,
        },
        ownerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Owner ID is required'],
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        isArchived: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `wsp_${ret._id.toString()}`;
                delete ret._id;
                delete (ret as any).__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `wsp_${ret._id.toString()}`;
                delete ret._id;
                delete (ret as any).__v;
                return ret;
            },
        },
    }
);

// UserWorkspace schema
const userWorkspaceSchema = new Schema<IUserWorkspace>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: [true, 'Workspace ID is required'],
        }, // Commented out for first version - depends on userId instead
        role: {
            type: String,
            enum: ['owner', 'admin', 'member', 'viewer'],
            required: [true, 'Role is required'],
            default: 'member',
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        invitationAcceptedAt: {
            type: Date,
            default: null,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `uw_${ret._id.toString()}`;
                delete ret._id;
                delete (ret as any).__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `uw_${ret._id.toString()}`;
                delete ret._id;
                delete (ret as any).__v;
                return ret;
            },
        },
    }
);

// Query middleware to filter out deleted workspaces
workspaceSchema.pre(
    /^find|countDocuments|estimatedDocumentCount|findOneAndUpdate|updateMany|updateOne/,
    async function () {
        const query = this as any;
        const options = query.getOptions();

        // If findDeleted option is set to true, or filter already specifies isDeleted, skip
        if (options.findDeleted === true) {
            return;
        }

        const filter = query.getFilter();
        if (filter && filter.isDeleted !== undefined) {
            return;
        }

        query.where({ isDeleted: { $ne: true } });
    }
);

// Query middleware to filter out deleted memberships
userWorkspaceSchema.pre(
    /^find|countDocuments|estimatedDocumentCount|findOneAndUpdate|updateMany|updateOne/,
    async function () {
        const query = this as any;
        const options = query.getOptions();

        if (options.findDeleted === true) {
            return;
        }

        const filter = query.getFilter();
        if (filter && filter.isDeleted !== undefined) {
            return;
        }

        query.where({ isDeleted: { $ne: true } });
    }
);

// Indexes
workspaceSchema.index({ name: 1 });
workspaceSchema.index({ ownerId: 1 });
workspaceSchema.index({ isDeleted: 1 });
workspaceSchema.index({ isArchived: 1 });
workspaceSchema.index({ createdAt: -1 });
workspaceSchema.index({ name: 'text', description: 'text' });

userWorkspaceSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });
userWorkspaceSchema.index({ workspaceId: 1, role: 1 });
userWorkspaceSchema.index({ userId: 1, role: 1 });
userWorkspaceSchema.index({ joinedAt: -1 });
userWorkspaceSchema.index({ invitedBy: 1 });

// Virtual fields
workspaceSchema.virtual('owner', {
    ref: 'User',
    localField: 'ownerId',
    foreignField: '_id',
    justOne: true,
});
workspaceSchema.virtual('users', {
    ref: 'UserWorkspace',
    localField: '_id',
    foreignField: 'workspaceId',
});
workspaceSchema.virtual('namespaces', {
    ref: 'Namespace',
    localField: '_id',
    foreignField: 'workspaceId',
});

userWorkspaceSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
});
userWorkspaceSchema.virtual('workspace', {
    ref: 'Workspace',
    localField: 'workspaceId',
    foreignField: '_id',
    justOne: true,
});

// Instance methods
workspaceSchema.methods.softDelete = async function (): Promise<IWorkspace> {
    this.isDeleted = true;
    this.deletedAt = new Date();
    const saved = await this.save();

    // Cascade soft delete to memberships
    await model('UserWorkspace').updateMany(
        { workspaceId: this._id },
        { isDeleted: true, deletedAt: new Date() }
    );

    return saved;
};
workspaceSchema.methods.restore = async function (): Promise<IWorkspace> {
    this.isDeleted = false;
    this.deletedAt = null;
    const saved = await this.save();

    // Restore memberships
    await model('UserWorkspace').updateMany(
        { workspaceId: this._id },
        { isDeleted: false, deletedAt: null }
    );

    return saved;
};
workspaceSchema.methods.archive = async function (): Promise<IWorkspace> {
    this.isArchived = true;
    return this.save();
};
workspaceSchema.methods.unarchive = async function (): Promise<IWorkspace> {
    this.isArchived = false;
    return this.save();
};
// workspaceSchema.methods.updateSettings = async function (settings: any): Promise<IWorkspace> {
//     Object.assign(this.settings, settings);
//     return this.save();
// };

userWorkspaceSchema.methods.updateRole = async function (
    newRole: WorkspaceRole
): Promise<IUserWorkspace> {
    this.role = newRole;
    return this.save();
};
userWorkspaceSchema.methods.acceptInvitation = async function (): Promise<IUserWorkspace> {
    this.invitationAcceptedAt = new Date();
    return this.save();
};
userWorkspaceSchema.methods.isOwner = function (): boolean {
    return this.role === 'owner';
};
userWorkspaceSchema.methods.isAdmin = function (): boolean {
    return this.role === 'admin' || this.role === 'owner';
};
userWorkspaceSchema.methods.canManageUsers = function (): boolean {
    return this.role === 'admin' || this.role === 'owner';
};
userWorkspaceSchema.methods.canManageSettings = function (): boolean {
    return this.role === 'owner';
};

// Static methods
workspaceSchema.statics.findByOwner = function (ownerId: string): Promise<IWorkspace[]> {
    return this.find({ ownerId: unprefixId(ownerId), isArchived: false });
};
workspaceSchema.statics.searchWorkspaces = function (
    query: string,
    limit: number = 10
): Promise<IWorkspace[]> {
    return this.find(
        {
            $text: { $search: query },
            isArchived: false,
        },
        { score: { $meta: 'textScore' } }
    )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit);
};
workspaceSchema.statics.getWorkspaceStats = async function (): Promise<{
    totalWorkspaces: number;
    activeWorkspaces: number;
    deletedWorkspaces: number;
    archivedWorkspaces: number;
}> {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalWorkspaces: { $sum: 1 },
                activeWorkspaces: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$isDeleted', false] },
                                    { $eq: ['$isArchived', false] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                deletedWorkspaces: {
                    $sum: { $cond: [{ $eq: ['$isDeleted', true] }, 1, 0] },
                },
                archivedWorkspaces: {
                    $sum: { $cond: [{ $eq: ['$isArchived', true] }, 1, 0] },
                },
            },
        },
        {
            $namespace: {
                _id: 0,
                totalWorkspaces: 1,
                activeWorkspaces: 1,
                deletedWorkspaces: 1,
                archivedWorkspaces: 1,
            },
        },
    ]);

    return (
        stats[0] || {
            totalWorkspaces: 0,
            activeWorkspaces: 0,
            deletedWorkspaces: 0,
            archivedWorkspaces: 0,
        }
    );
};
workspaceSchema.statics.getRecentWorkspaces = function (days: number = 30): Promise<IWorkspace[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.find({
        createdAt: { $gte: startDate },
        isArchived: false,
    }).sort({ createdAt: -1 });
};
workspaceSchema.statics.findDeleted = function (): Promise<IWorkspace[]> {
    return this.find({}).setOptions({ findDeleted: true }).where({
        isDeleted: true,
    });
};
workspaceSchema.statics.findArchived = function (): Promise<IWorkspace[]> {
    return this.find({ isArchived: true });
};
workspaceSchema.statics.permanentlyDelete = function (workspaceId: string): Promise<void> {
    return this.findByIdAndDelete(workspaceId).setOptions({
        findDeleted: true,
    }) as any;
};

userWorkspaceSchema.statics.findByUser = function (userId: string) {
    return this.find({ userId: unprefixId(userId) }).populate('workspace');
};
userWorkspaceSchema.statics.findByWorkspace = function (workspaceId: string) {
    return this.find({ workspaceId: unprefixId(workspaceId) }).populate('user');
};
userWorkspaceSchema.statics.findByUserAndWorkspace = async function (
    userId: string,
    workspaceId: string
) {
    return await this.findOne({
        userId: unprefixId(userId),
        workspaceId: unprefixId(workspaceId),
    });
};
userWorkspaceSchema.statics.findByEmailAndWorkspace = async function (
    email: string,
    workspaceId: string
) {
    const user = await User.findOne({ email }).select('_id').lean().exec();
    if (!user) return null;

    return this.findOne({ workspaceId: unprefixId(workspaceId), userId: user._id })
        .populate('user')
        .exec();
};
userWorkspaceSchema.statics.findOwner = function (workspaceId: string) {
    return this.findOne({ workspaceId: unprefixId(workspaceId), role: 'owner' }).populate('user');
};
userWorkspaceSchema.statics.findAdmins = function (workspaceId: string) {
    return this.find({
        workspaceId: unprefixId(workspaceId),
        role: { $in: ['owner', 'admin'] },
    }).populate('user');
};
userWorkspaceSchema.statics.findByRole = function (workspaceId: string, role: WorkspaceRole) {
    return this.find({ workspaceId: unprefixId(workspaceId), role }).populate('user');
};
userWorkspaceSchema.statics.getUserRole = async function (
    userId: string,
    workspaceId: string
): Promise<WorkspaceRole | null> {
    const membership = await this.findOne({
        userId: unprefixId(userId),
        workspaceId: unprefixId(workspaceId),
    });
    return membership ? membership.role : null;
};
userWorkspaceSchema.statics.isUserMember = async function (
    userId: string,
    workspaceId: string
): Promise<boolean> {
    const membership = await this.findOne({
        userId: unprefixId(userId),
        workspaceId: unprefixId(workspaceId),
    });
    return !!membership;
};
userWorkspaceSchema.statics.isUserOwner = async function (
    userId: string,
    workspaceId: string
): Promise<boolean> {
    const membership = await this.findOne({
        userId: unprefixId(userId),
        workspaceId: unprefixId(workspaceId),
        role: 'owner',
    });
    return !!membership;
};
userWorkspaceSchema.statics.isUserAdmin = async function (
    userId: string,
    workspaceId: string
): Promise<boolean> {
    const membership = await this.findOne({
        userId: unprefixId(userId),
        workspaceId: unprefixId(workspaceId),
        role: { $in: ['owner', 'admin'] },
    });
    return !!membership;
};
userWorkspaceSchema.statics.getMemberCount = function (workspaceId: string) {
    return this.countDocuments({ workspaceId: unprefixId(workspaceId) });
};
userWorkspaceSchema.statics.getRoleStats = async function (workspaceId: string) {
    const stats = await this.aggregate([
        { $match: { workspaceId: new Types.ObjectId(unprefixId(workspaceId)) } },
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 },
            },
        },
    ]);

    const result: Record<WorkspaceRole, number> = {
        owner: 0,
        admin: 0,
        member: 0,
        viewer: 0,
    };
    stats.forEach(stat => {
        result[stat._id as WorkspaceRole] = stat.count;
    });

    return result;
};
userWorkspaceSchema.statics.getRecentMembers = function (workspaceId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.find({
        workspaceId: unprefixId(workspaceId),
        joinedAt: { $gte: startDate },
    })
        .populate('user')
        .sort({ joinedAt: -1 });
};
userWorkspaceSchema.statics.getPendingInvitations = function (workspaceId: string) {
    return this.find({
        workspaceId: unprefixId(workspaceId),
        invitationAcceptedAt: null,
    }).populate('user');
};

// Export the model
export const Workspace = model<IWorkspace, IWorkspaceModel>('Workspace', workspaceSchema);

export const UserWorkspace = model<IUserWorkspace, UserWorkspaceModel>(
    'UserWorkspace',
    userWorkspaceSchema
);
