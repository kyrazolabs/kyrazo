import { Schema, model } from 'mongoose';
import { IWebhookEventProcessed, IWebhookEventProcessedModel } from '../../types';

// Webhook Events Processed schema
const sourceEventsProcessedSchema = new Schema<IWebhookEventProcessed>(
    {
        eventId: {
            type: String,
            required: [true, 'Event ID is required'],
            unique: true,
        },
        eventType: {
            type: String,
            required: [true, 'Event type is required'],
        },
        processedAt: {
            type: Date,
            required: [true, 'Processed at is required'],
            default: Date.now,
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
sourceEventsProcessedSchema.index({ eventType: 1 });
sourceEventsProcessedSchema.index({ processedAt: 1 });

// TTL index for processed events (30 days)
sourceEventsProcessedSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static methods
sourceEventsProcessedSchema.statics.findByEventId = function (eventId: string) {
    return this.findOne({ eventId });
};

// Export the model
export const WebhookEventProcessed = model<IWebhookEventProcessed, IWebhookEventProcessedModel>(
    'WebhookEventProcessed',
    sourceEventsProcessedSchema
);
export default WebhookEventProcessed;
