import { Schema, model } from 'mongoose';
import { IPlan, IPlanModel } from '../../types';

// Plan schema
const planSchema = new Schema<IPlan>(
    {
        name: {
            type: String,
            required: [true, 'Plan name is required'],
            trim: true,
            minlength: [2, 'Plan name must be at least 2 characters long'],
            maxlength: [100, 'Plan name cannot exceed 100 characters'],
        },
        slug: {
            type: String,
            required: [true, 'Plan slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[a-z0-9-]+$/,
                'Slug can only contain lowercase letters, numbers, and hyphens',
            ],
        },
        description: {
            type: String,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        priceCents: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price cannot be negative'],
        },
        currency: {
            type: String,
            required: [true, 'Currency is required'],
            uppercase: true,
            default: 'USD',
            enum: ['USD', 'EUR', 'GBP'],
        },
        interval: {
            type: String,
            required: [true, 'Interval is required'],
            enum: ['month', 'year'],
        },
        overagePriceCents: {
            type: Number,
            default: 0,
            min: [0, 'Overage price cannot be negative'],
        },
        features: {
            type: Schema.Types.Mixed,
            default: {},
        },
        limits: {
            eventsPerSecond: {
                type: Number,
                required: [true, 'Events per second limit is required'],
                min: [0, 'Events per second cannot be negative'],
            },
            eventsPerMonth: {
                type: Number,
                required: [true, 'Events per month limit is required'],
                min: [0, 'Events per month cannot be negative'],
            },
            maxProjects: {
                type: Number,
                required: [true, 'Max projects limit is required'],
                min: [0, 'Max projects cannot be negative'],
            },
            maxMembers: {
                type: Number,
                required: [true, 'Max members limit is required'],
                min: [0, 'Max members cannot be negative'],
            },
            maxConnectors: {
                type: Number,
                required: [true, 'Max connectors limit is required'],
                min: [0, 'Max connectors cannot be negative'],
            },
            maxIntegrations: {
                type: Number,
                required: [true, 'Max integrations limit is required'],
                min: [0, 'Max integrations cannot be negative'],
            },
            maxConcurrent: {
                type: Number,
                required: [true, 'Max concurrent limit is required'],
                min: [0, 'Max concurrent cannot be negative'],
            },
        },
        stripeProductId: { type: String, required: true },
        stripePriceId: { type: String, required: true },
        stripeMeteredPriceId: { type: String },
        stripeMeterId: { type: String },
        stripeMeterEventName: { type: String },
        isActive: {
            type: Boolean,
            default: true,
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
planSchema.index({ slug: 1 });
planSchema.index({ isActive: 1 });
planSchema.index({ 'limits.eventsPerSecond': 1 });
planSchema.index({ 'limits.eventsPerMonth': 1 });
planSchema.index({ 'limits.maxProjects': 1 });
planSchema.index({ 'limits.maxMembers': 1 });
planSchema.index({ createdAt: -1 });

// Static methods
planSchema.statics.findBySlug = function (slug: string): Promise<IPlan> {
    return this.findOne({ slug, isActive: true });
};

planSchema.statics.findActivePlans = function () {
    return this.find({ isActive: true }).sort({ priceCents: 1 });
};

// Export the model
export const Plan = model<IPlan, IPlanModel>('Plan', planSchema);
export default Plan;
