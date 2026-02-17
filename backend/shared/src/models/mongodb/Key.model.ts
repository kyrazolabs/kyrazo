import { Schema, model } from 'mongoose';
import { IAPIKey, IAPIKeyModel } from '../../types';

const apiKeySchema = new Schema<IAPIKey>(
    {
        kid: {
            type: String,
            required: true,
            unique: true,
            select: false,
        },
        key: {
            type: String,
            required: true,
            unique: true,
            select: false,
        },
        name: {
            type: String,
            required: true,
        },
        workspace: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace', // افترض أن لديك نموذج 'ًWorkspace'
            required: true,
        },
        createBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        scopes: {
            type: [String],
            enum: [
                'dispatch:event',
                'dispatch:event:batch',

                'dispatch:target:create',
                'dispatch:target:read',
                'dispatch:target:update',
                'dispatch:target:delete',
                'dispatch:target:signing:rotate',

                'ingest:source:create',
                'ingest:source:read',
                'ingest:source:update',
                'ingest:source:delete',

                'ingest:endpoint:create',
                'ingest:endpoint:read',
                'ingest:endpoint:update',
                'ingest:endpoint:delete',
            ],
            default: [], // مثال: ['read:products', 'write:orders']
        },
        lastFour: {
            type: String,
            required: true,
        },
        ipWhitelist: {
            type: [String],
            default: [],
        },
        isEnabled: {
            type: Boolean,
            default: true,
        },
        expiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true, // لإضافة createdAt و updatedAt تلقائيًا
    }
);

// إضافة index لتحسين أداء البحث
apiKeySchema.index({ name: 'text' });
apiKeySchema.index({ workspace: 1, kid: 1 });
apiKeySchema.index({ lastFour: 1 });
apiKeySchema.index({ createBy: 1 });

export const Key = model<IAPIKey, IAPIKeyModel>('Key', apiKeySchema);

export default Key;
