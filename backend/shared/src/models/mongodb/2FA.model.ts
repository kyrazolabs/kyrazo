import { Schema, model } from 'mongoose';
import { IUser2FA, IUser2FAModel, TwoFAMethod } from '../../types';
import { unprefixId } from '../../utils/id';

// User 2FA schema
const user2FASchema = new Schema<IUser2FA>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            unique: true,
        },
        isEnabled: {
            type: Boolean,
            default: false,
        },
        method: {
            type: String,
            enum: ['email', 'app'],
            required: [true, '2FA method is required'],
        },
        secret: {
            type: String,
            required: [true, '2FA secret is required'],
            select: false, // Don't include in queries by default
        },
        enabledAt: {
            type: Date,
            default: null,
        },
        backupCodes: {
            type: [String],
            default: [],
            select: false, // Don't include in queries by default
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (doc, ret) {
                delete (ret as any).secret;
                delete (ret as any).backupCodes;
                delete (ret as any).__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (doc, ret) {
                delete (ret as any).secret;
                delete (ret as any).backupCodes;
                delete (ret as any).__v;
                return ret;
            },
        },
    }
);

// Indexes
user2FASchema.index({ isEnabled: 1 });
user2FASchema.index({ method: 1 });

// Instance methods
user2FASchema.methods.enable = async function (): Promise<void> {
    this.isEnabled = true;
    this.enabledAt = new Date();
    await this.save();
};

user2FASchema.methods.disable = async function (): Promise<void> {
    this.isEnabled = false;
    this.enabledAt = null;
    await this.save();
};

user2FASchema.methods.updateSecret = async function (newSecret: string): Promise<void> {
    this.secret = newSecret;
    await this.save();
};

user2FASchema.methods.generateBackupCodes = function (): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
    }
    this.backupCodes = codes;
    return codes;
};

user2FASchema.methods.useBackupCode = async function (code: string): Promise<boolean> {
    const index = this.backupCodes.indexOf(code.toUpperCase());
    if (index === -1) return false;

    this.backupCodes.splice(index, 1);
    await this.save();
    return true;
};

// Static methods
user2FASchema.statics.findByUserId = function (userId: string) {
    return this.findOne({ userId: unprefixId(userId) });
};

user2FASchema.statics.findEnabledByUserId = function (userId: string) {
    return this.findOne({ userId: unprefixId(userId), isEnabled: true });
};

user2FASchema.statics.getEnabledCount = function () {
    return this.countDocuments({ isEnabled: true });
};

user2FASchema.statics.getMethodStats = async function () {
    const stats = await this.aggregate([
        { $match: { isEnabled: true } },
        {
            $group: {
                _id: '$method',
                count: { $sum: 1 },
            },
        },
    ]);

    const result: Record<TwoFAMethod, number> = { email: 0, app: 0 };
    stats.forEach(stat => {
        result[stat._id as TwoFAMethod] = stat.count;
    });

    return result;
};

// Export the model
export const User2FA = model<IUser2FA, IUser2FAModel>('User2FA', user2FASchema);
export default User2FA;
