import { Schema, model } from 'mongoose';
import { IUserPreference } from '../../types/user.types';

const userPreferenceSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        notification: {
            sourceFailures: { type: Boolean, default: true },
            dailySummary: { type: Boolean, default: true },
            securityAlerts: { type: Boolean, default: true },
            weeklyReports: { type: Boolean, default: true },
            preferences: {
                emailFrequency: { type: String, required: true },
                quietHours: { type: String, required: true, default: null },
            },
        },
    },
    { timestamps: true }
);

export const UserPreference = model<IUserPreference>(
    'UserPreference',
    userPreferenceSchema
);
