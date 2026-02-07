import { Schema, model } from 'mongoose';
import { ISubscription, ISubscriptionModel } from '../../types';
import { unprefixId } from '../../utils/id';

// Subscription schema
const subscriptionSchema = new Schema<ISubscription>(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: [true, 'Workspace ID is required'],
            index: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        planId: {
            type: Schema.Types.ObjectId,
            ref: 'Plan',
            required: [true, 'Plan ID is required'],
            index: true,
        },
        planSnapshot: {
            planId: {
                type: Schema.Types.ObjectId,
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            slug: {
                type: String,
                required: true,
            },
            priceCents: {
                type: Number,
                required: true,
            },
            currency: {
                type: String,
                required: true,
            },
            interval: {
                type: String,
                required: true,
                enum: ['month', 'year'],
            },
            features: {
                type: Schema.Types.Mixed,
                default: {},
            },
            limits: {
                eventsPerSecond: {
                    type: Number,
                    required: true,
                },
                eventsPerMonth: {
                    type: Number,
                    required: true,
                },
                maxProjects: {
                    type: Number,
                    required: true,
                },
                maxMembers: {
                    type: Number,
                    required: true,
                },
                maxConnectors: {
                    type: Number,
                    required: true,
                },
                maxIntegrations: {
                    type: Number,
                    required: true,
                },
                maxConcurrent: {
                    type: Number,
                    required: true,
                },
            },
            // stripeProductId: { type: String, required: true },
            // stripePlanId: { type: String, required: true },
        },
        status: {
            type: String,
            required: [true, 'Status is required'],
            enum: [
                'active',
                'canceled',
                'incomplete',
                'incomplete_expired',
                'past_due',
                'paused',
                'trialing',
                'unpaid',
            ],
            default: 'incomplete',
            index: true,
        },
        stripeSubscriptionId: { type: String, sparse: true, index: true },
        billingCycleAnchor: {
            type: Date,
            required: [true, 'Billing cycle anchor is required'],
        },
        lastInvoiceId: {
            type: String,
        },
        paymentFailureCount: {
            type: Number,
            default: 0,
        },
        currentPeriodStart: {
            type: Date,
            required: [true, 'Current period start is required'],
            index: true,
        },
        currentPeriodEnd: {
            type: Date,
            required: [true, 'Current period end is required'],
        },
        trialEnd: {
            type: Date,
        },
        quantity: {
            type: Number,
            default: 1,
            min: [1, 'Quantity must be at least 1'],
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
        canceledAt: {
            type: Date,
        },
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
subscriptionSchema.index({ workspaceId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ createdAt: -1 });

// Static methods
subscriptionSchema.statics.findByWorkspace = function (workspaceId: string) {
    return this.find({ workspaceId: unprefixId(workspaceId) }).sort({ createdAt: -1 });
};

subscriptionSchema.statics.findActiveByWorkspace = function (workspaceId: string) {
    return this.findOne({ workspaceId: unprefixId(workspaceId), status: 'active' });
};

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function () {
    return this.status === 'active';
});

// Virtual for checking if subscription is in trial
subscriptionSchema.virtual('isTrial').get(function () {
    return this.status === 'trialing' && this.trialEnd && this.trialEnd > new Date();
});

// Virtual for checking if subscription is canceled
subscriptionSchema.virtual('isCanceled').get(function () {
    return this.status === 'canceled';
});

// Export the model
export const Subscription = model<ISubscription, ISubscriptionModel>(
    'Subscription',
    subscriptionSchema
);
export default Subscription;
