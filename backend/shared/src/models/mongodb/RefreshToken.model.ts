import { Schema, model, Document, Types } from 'mongoose';
import { IRefreshToken, IRefreshTokenModel } from '../../types';
import { unprefixId } from '../../utils/id';

// Define a Mongoose schema for the Refresh Token
const RefreshTokenSchema = new Schema<IRefreshToken & Document>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User', // Reference to the User model
    },
    token: {
        type: String,
        required: true,
        unique: true, // Ensure token uniqueness
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // TTL index for automatic deletion
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    ipAddress: {
        type: String,
        required: false,
    },
    userAgent: {
        type: String,
        required: false,
    },
    isRevoked: {
        type: Boolean,
        default: false,
    },
    usedAt: {
        type: Date,
        required: false,
    },
});

RefreshTokenSchema.methods.revokeToken = async function () {
    this.isRevoked = true;
    return this.save();
};

// Add static methods for common operations
RefreshTokenSchema.statics.findByToken = async function (token: string) {
    return this.findOne({
        token,
        isRevoked: false,
        expiresAt: { $gt: new Date() },
    });
};

RefreshTokenSchema.statics.revokeToken = async function (token: string) {
    return this.findOneAndUpdate({ token }, { $set: { isRevoked: true } }, { new: true });
};

RefreshTokenSchema.statics.revokeAllUserTokens = async function (userId: string) {
    return this.updateMany(
        { userId: unprefixId(userId), isRevoked: false },
        { $set: { isRevoked: true } }
    );
};

// Create and export the Mongoose model
export const RefreshToken = model<IRefreshToken & Document, IRefreshTokenModel>(
    'RefreshToken',
    RefreshTokenSchema
);

export default RefreshToken;
