import { Customer } from '@kyrazo/shared';
import {
    WebhookEventProcessed,
    ICustomer,
    IWebhookEventProcessed,
} from '@kyrazo/shared';

export class PaymentRepository {
    async createCustomer(customerData: Partial<ICustomer>): Promise<ICustomer> {
        const customer = new (Customer as any)(customerData);
        return await customer.save();
    }

    async findCustomerByWorkspace(
        workspaceId: string
    ): Promise<ICustomer | null> {
        return await (Customer as any).findOne({ workspaceId });
    }

    async findCustomerByStripeId(
        stripeCustomerId: string
    ): Promise<ICustomer | null> {
        return await (Customer as any).findOne({ stripeCustomerId });
    }

    async updateCustomerByStripeId(
        stripeCustomerId: string,
        updateData: Partial<ICustomer>
    ): Promise<ICustomer | null> {
        return await (Customer as any).findOneAndUpdate(
            { stripeCustomerId },
            updateData,
            { new: true }
        );
    }

    async recordWebhookEvent(
        eventId: string,
        eventType: string
    ): Promise<IWebhookEventProcessed> {
        const sourceEvent = new (WebhookEventProcessed as any)({
            eventId,
            eventType,
            processedAt: new Date(),
        });
        return await sourceEvent.save();
    }

    async findWebhookEvent(
        eventId: string
    ): Promise<IWebhookEventProcessed | null> {
        return await (WebhookEventProcessed as any).findOne({ eventId });
    }

    async deleteOldWebhookEvents(olderThanDays: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

        const result = await (WebhookEventProcessed as any).deleteMany({
            createdAt: { $lt: cutoffDate },
        });

        return result.deletedCount || 0;
    }
}

export const paymentRepository = new PaymentRepository();
