import { Schema, Types, model } from 'mongoose';
import { IUsage, IUsageModel } from '../../types';
import { unprefixId } from '../../utils/id';

// Usage schema
const usageSchema = new Schema<IUsage>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: [true, 'Workspace ID is required'],
            index: true,
        },
        subscriptionId: {
            type: Schema.Types.ObjectId,
            ref: 'Subscription',
            required: [true, 'Subscription ID is required'],
            index: true,
        },
        meteredSubscriptionItemId: { type: String, required: true },
        stripeMeterEventName: { type: String, required: true },
        eventType: {
            type: String,
            required: [true, 'Event type is required'],
            index: true,
        },
        count: {
            type: Number,
            required: [true, 'Count is required'],
            min: [0, 'Count cannot be negative'],
            default: 0,
        },
        periodStart: {
            type: Date,
            required: [true, 'Period start is required'],
            index: true,
        },
        periodEnd: {
            type: Date,
            required: [true, 'Period end is required'],
            index: true,
        },
        aggregatedAt: {
            type: Date,
            required: [true, 'Aggregated at is required'],
            default: Date.now,
        },
        reported: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
        },
        toObject: {
            virtuals: true,
        },
    }
);

// Indexes
usageSchema.index({ workspaceId: 1, periodStart: 1, periodEnd: 1 });
usageSchema.index({ subscriptionId: 1, eventType: 1, periodStart: 1 });
usageSchema.index({ eventType: 1, periodStart: 1, periodEnd: 1 });
usageSchema.index({ aggregatedAt: 1 });
usageSchema.index({ createdAt: -1 });

// TTL index for old usage records (90 days)
usageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static methods
usageSchema.statics.aggregateUsage = function (
    workspaceId: string,
    periodStart: Date,
    periodEnd: Date
) {
    return this.aggregate([
        {
            $match: {
                workspaceId: new Types.ObjectId(unprefixId(workspaceId)),
                periodStart: { $gte: periodStart },
                periodEnd: { $lte: periodEnd },
            },
        },
        {
            $group: {
                _id: {
                    subscriptionId: '$subscriptionId',
                    eventType: '$eventType',
                },
                totalCount: { $sum: '$count' },
                records: { $sum: 1 },
                periodStart: { $min: '$periodStart' },
                periodEnd: { $max: '$periodEnd' },
            },
        },
        {
            $namespace: {
                _id: 0,
                subscriptionId: '$_id.subscriptionId',
                eventType: '$_id.eventType',
                totalCount: 1,
                records: 1,
                periodStart: 1,
                periodEnd: 1,
            },
        },
    ]);
};

usageSchema.statics.bulkInsert = function (usages: Partial<IUsage>[]) {
    return this.insertMany(usages);
};

// Export the model
export const Usage = model<IUsage, IUsageModel>('Usage', usageSchema);
export default Usage;
