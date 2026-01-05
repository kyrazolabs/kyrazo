import { Schema, model } from 'mongoose';
import { IUser, IUserModel, UpdateProfileInput } from '../../types/user.types';

// User schema
const userSchema = new Schema<IUser>(
    {
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            minlength: [2, 'First name must be at least 2 characters long'],
            maxlength: [100, 'First name cannot exceed 100 characters'],
        },
        lastName: {
            type: String,
            required: [true, 'Last name is required'],
            trim: true,
            minlength: [2, 'Last name must be at least 2 characters long'],
            maxlength: [100, 'Last name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please enter a valid email',
            ],
        },
        jobTitle: {
            type: String,
            default: null,
        },
        avatar: {
            type: String,
            default: 'https://avatar.iran.liara.run/public',
        },
        passwordHash: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            select: false, // Don't include in queries by default
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        timeZone: {
            type: String,
            default: 'UTC',
        },
        language: {
            type: String,
            default: 'en',
            enum: ['en', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja'],
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: {
            type: String,
            select: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete (ret as any).passwordHash;
                delete (ret as any).__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
        },
    }
);

// Indexes
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({
    firstName: 'text',
    lastName: 'text',
    email: 'text',
});

userSchema.virtual('workspaces', {
    ref: 'UserWorkspace',
    localField: '_id',
    foreignField: 'userId',
});

// userSchema.virtual('teams', {
//     ref: 'UserTeam',
//     localField: '_id',
//     foreignField: 'userId',
// });

userSchema.virtual('twoFA', {
    ref: 'User2FA',
    localField: '_id',
    foreignField: 'userId',
    justOne: true,
});

// Pre-save middleware to hash password
userSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) return;

    this.passwordHash = await Bun.password.hash(this.passwordHash, {
        algorithm: 'bcrypt',
        cost: 12,
    });
});

// Instance methods
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return await Bun.password.verify(candidatePassword, this.passwordHash);
};

userSchema.methods.updateLastLogin = async function (): Promise<void> {
    this.lastLogin = new Date();
    await this.save();
};

userSchema.methods.deactivate = async function (): Promise<void> {
    this.isActive = false;
    await this.save();
};

userSchema.methods.activate = async function (): Promise<void> {
    this.isActive = true;
    await this.save();
};

userSchema.methods.updateProfile = async function (
    updates: UpdateProfileInput
): Promise<IUser> {
    Object.assign(this, updates);
    return await this.save();
};

// Static methods
userSchema.statics.findByEmail = function (email: string) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findActiveUsers = function () {
    return this.find({ isActive: true });
};

// Removed findByLoginType method as LoginType is not defined

userSchema.statics.searchUsers = function (query: string, limit: number = 10) {
    return this.find(
        { $text: { $search: query }, isActive: true },
        { score: { $meta: 'textScore' } }
    )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit);
};

userSchema.statics.getUserStats = async function () {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
                inactiveUsers: { $sum: { $cond: ['$isActive', 0, 1] } },
            },
        },
        {
            $project: {
                _id: 0,
                totalUsers: 1,
                activeUsers: 1,
                inactiveUsers: 1,
            },
        },
    ]);

    return stats[0] || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0 };
};

userSchema.statics.getRecentUsers = function (days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.find({
        createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 });
};

// Export the model
export const User = model<IUser, IUserModel>('User', userSchema);
export default User;
