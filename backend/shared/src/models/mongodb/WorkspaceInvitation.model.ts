import { Schema, model, Types } from 'mongoose';
import crypto from 'crypto';
import { IWorkspaceInvitation, IWorkspaceInvitationModel, WorkspaceRole } from '../../types';
import { unprefixId } from '../../utils/id';

const workspaceInvitationSchema = new Schema<IWorkspaceInvitation>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: [true, 'Workspace ID is required'],
            index: true,
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Invited by user ID is required'],
        },
        inviteeEmail: {
            type: String,
            required: [true, 'Invitee email is required'],
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
            index: true,
        },
        inviteeUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member', 'viewer'],
            required: [true, 'Role is required'],
            default: 'member',
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'expired'],
            default: 'pending',
            index: true,
        },
        token: {
            type: String,
            required: [true, 'Invitation token is required'],
            unique: true,
            index: true,
        },
        message: {
            type: String,
            maxlength: [500, 'Message cannot exceed 500 characters'],
            default: null,
        },
        expiresAt: {
            type: Date,
            required: [true, 'Expiration date is required'],
        },
        acceptedAt: {
            type: Date,
            default: null,
        },
        declinedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `winv_${ret._id.toString()}`;
                delete ret._id;
                delete (ret as any).__v;
                delete (ret as any).token; // Don't expose token in JSON responses
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret: any) {
                ret.id = `winv_${ret._id.toString()}`;
                delete ret._id;
                delete (ret as any).__v;
                return ret;
            },
        },
    }
);

// Indexes
workspaceInvitationSchema.index({ workspaceId: 1, inviteeEmail: 1 });
workspaceInvitationSchema.index({ workspaceId: 1, status: 1 });
workspaceInvitationSchema.index({ invitedBy: 1 });
workspaceInvitationSchema.index({ expiresAt: 1 }, { expires: 0 });
workspaceInvitationSchema.index({ inviteeUserId: 1, status: 1 });

// Virtual fields
workspaceInvitationSchema.virtual('workspace', {
    ref: 'Workspace',
    localField: 'workspaceId',
    foreignField: '_id',
    justOne: true,
});

workspaceInvitationSchema.virtual('inviter', {
    ref: 'User',
    localField: 'invitedBy',
    foreignField: '_id',
    justOne: true,
});

workspaceInvitationSchema.virtual('invitee', {
    ref: 'User',
    localField: 'inviteeUserId',
    foreignField: '_id',
    justOne: true,
});

workspaceInvitationSchema.virtual('isExpired').get(function (this: IWorkspaceInvitation) {
    return this.expiresAt < new Date();
});

workspaceInvitationSchema.virtual('isPending').get(function (this: IWorkspaceInvitation) {
    return this.status === 'pending' && !this.isExpired;
});

workspaceInvitationSchema.virtual('canAccept').get(function (this: IWorkspaceInvitation) {
    return this.status === 'pending' && !this.isExpired;
});

workspaceInvitationSchema.virtual('canDecline').get(function (this: IWorkspaceInvitation) {
    return this.status === 'pending' && !this.isExpired;
});

// Instance methods
workspaceInvitationSchema.methods.accept = async function (
    userId?: string
): Promise<IWorkspaceInvitation> {
    if (!this.canAccept) {
        throw new Error('Invitation cannot be accepted');
    }

    this.status = 'accepted';
    this.acceptedAt = new Date();

    // Set inviteeUserId if provided and not already set
    if (userId && !this.inviteeUserId) {
        this.inviteeUserId = userId as any;
    }

    return this.save();
};

workspaceInvitationSchema.methods.decline = async function (): Promise<IWorkspaceInvitation> {
    if (!this.canDecline) {
        throw new Error('Invitation cannot be declined');
    }

    this.status = 'declined';
    this.declinedAt = new Date();
    return this.save();
};

workspaceInvitationSchema.methods.expire = async function (): Promise<IWorkspaceInvitation> {
    if (this.status !== 'pending') {
        throw new Error('Only pending invitations can be expired');
    }

    this.status = 'expired';
    return this.save();
};

workspaceInvitationSchema.methods.extendExpiry = async function (
    days: number = 7
): Promise<IWorkspaceInvitation> {
    if (this.status !== 'pending') {
        throw new Error('Only pending invitations can be extended');
    }

    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);
    this.expiresAt = newExpiry;
    return this.save();
};

workspaceInvitationSchema.methods.resend = async function (
    newToken?: string
): Promise<IWorkspaceInvitation> {
    if (this.status !== 'pending') {
        throw new Error('Only pending invitations can be resent');
    }

    if (newToken) {
        this.token = newToken;
    }

    // Extend expiry by 7 days when resending
    await this.extendExpiry(7);
    return this.save();
};

// Static methods
workspaceInvitationSchema.statics.findByToken = function (token: string) {
    return this.findOne({
        token,
        status: 'pending',
        expiresAt: { $gt: new Date() },
    }).populate('workspace inviter');
};

workspaceInvitationSchema.statics.findByWorkspace = function (workspaceId: string) {
    return this.find({ workspaceId: unprefixId(workspaceId) })
        .populate('inviter invitee')
        .sort({ createdAt: -1 });
};

workspaceInvitationSchema.statics.findByEmail = function (email: string) {
    return this.find({
        inviteeEmail: email.toLowerCase(),
    })
        .populate('workspace inviter')
        .sort({ createdAt: -1 });
};

workspaceInvitationSchema.statics.findPending = function (workspaceId?: string) {
    const query: any = {
        status: 'pending',
        expiresAt: { $gt: new Date() },
    };

    if (workspaceId) {
        query.workspaceId = unprefixId(workspaceId);
    }

    return this.find(query).populate('workspace inviter invitee').sort({ createdAt: -1 });
};

workspaceInvitationSchema.statics.findExpired = function (workspaceId?: string) {
    const query: any = {
        $or: [{ status: 'expired' }, { status: 'pending', expiresAt: { $lte: new Date() } }],
    };

    if (workspaceId) {
        query.workspaceId = unprefixId(workspaceId);
    }

    return this.find(query).populate('workspace inviter').sort({ createdAt: -1 });
};

workspaceInvitationSchema.statics.findAccepted = function (workspaceId?: string) {
    const query: any = { status: 'accepted' };

    if (workspaceId) {
        query.workspaceId = unprefixId(workspaceId);
    }

    return this.find(query).populate('workspace inviter invitee').sort({ acceptedAt: -1 });
};

workspaceInvitationSchema.statics.findDeclined = function (workspaceId?: string) {
    const query: any = { status: 'declined' };

    if (workspaceId) {
        query.workspaceId = unprefixId(workspaceId);
    }

    return this.find(query).populate('workspace inviter').sort({ declinedAt: -1 });
};

workspaceInvitationSchema.statics.findByUser = function (userId: string) {
    return this.find({
        $or: [{ invitedBy: unprefixId(userId) }, { inviteeUserId: unprefixId(userId) }],
    })
        .populate('workspace inviter invitee')
        .sort({ createdAt: -1 });
};

workspaceInvitationSchema.statics.hasPendingInvitation = async function (
    workspaceId: string,
    email: string
): Promise<boolean> {
    const invitation = await this.findOne({
        workspaceId: unprefixId(workspaceId),
        inviteeEmail: email.toLowerCase(),
        status: 'pending',
        expiresAt: { $gt: new Date() },
    });

    return !!invitation;
};

workspaceInvitationSchema.statics.getInvitationStats = async function (workspaceId?: string) {
    const matchStage: any = {};
    if (workspaceId) {
        matchStage.workspaceId = new Types.ObjectId(unprefixId(workspaceId));
    }

    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
            },
        },
    ]);

    const result = {
        total: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        expired: 0,
    };

    stats.forEach(stat => {
        result.total += stat.count;
        if (result.hasOwnProperty(stat._id)) {
            result[stat._id as keyof typeof result] = stat.count;
        }
    });

    return result;
};

workspaceInvitationSchema.statics.cleanupExpired = function () {
    return this.updateMany(
        {
            status: 'pending',
            expiresAt: { $lte: new Date() },
        },
        {
            $set: { status: 'expired' },
        }
    );
};

workspaceInvitationSchema.statics.createInvitation = async function (
    workspaceId: string,
    invitedBy: string,
    inviteeEmail: string,
    role: WorkspaceRole,
    message?: string,
    expiresInDays: number = 7
): Promise<IWorkspaceInvitation> {
    // Check if there's already a pending invitation
    const existingInvitation = await (this as IWorkspaceInvitationModel).hasPendingInvitation(
        workspaceId,
        inviteeEmail
    );
    if (existingInvitation) {
        throw new Error('A pending invitation already exists for this email');
    }

    // Generate unique token
    const token = generateToken();

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Check if user already exists
    const User = model('User');
    const existingUser = await User.findOne({
        email: inviteeEmail.toLowerCase(),
    });

    const invitation = new this({
        workspaceId: unprefixId(workspaceId),
        invitedBy: unprefixId(invitedBy),
        inviteeEmail,
        inviteeUserId: existingUser?._id || null,
        role,
        token,
        message,
        expiresAt,
    });

    return invitation.save();
};

const generateToken = function (): string {
    return crypto.randomBytes(32).toString('hex');
};

// Pre-save middleware
workspaceInvitationSchema.pre('save', async function () {
    if (!this.isModified('token')) return;

    // Optional: hash token if we want to secure it like passwords
    // For invitations, usually the token is the secret.
    // If we want to invalidate old tokens, we can do it via expiresAt.

    // Auto-expire if past expiry date
    if (this.status === 'pending' && this.isExpired) {
        this.status = 'expired';
    }

    // Validate that inviter is not inviting themselves
    if (this.inviteeUserId && this.inviteeUserId.toString() === this.invitedBy.toString()) {
        throw new Error('Cannot invite yourself to a workspace');
    }
});

// Export the model
export const WorkspaceInvitation = model<IWorkspaceInvitation, IWorkspaceInvitationModel>(
    'WorkspaceInvitation',
    workspaceInvitationSchema
);

export default WorkspaceInvitation;
