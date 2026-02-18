import { Subscription, ISubscription, unprefixId, ClientSession } from '@kyrazo/shared';

export class SubscriptionRepository {
    async create(
        subscriptionData: Partial<ISubscription>,
        session?: ClientSession
    ): Promise<ISubscription> {
        const subscription = new (Subscription as any)(subscriptionData);
        return await subscription.save({ session });
    }

    async findById(id: string): Promise<ISubscription | null> {
        return await (Subscription as any).findById(unprefixId(id));
    }

    async findByWorkspace(workspaceId: string): Promise<ISubscription[]> {
        return await (Subscription as any)
            .find({ workspaceId: unprefixId(workspaceId) })
            .sort({ createdAt: -1 });
    }

    async findActiveByWorkspace(workspaceId: string): Promise<ISubscription | null> {
        return await (Subscription as any).findOne({
            workspaceId: unprefixId(workspaceId),
            status: 'active',
        });
    }

    async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<ISubscription | null> {
        return await (Subscription as any).findOne({ stripeSubscriptionId });
    }

    async findAll(
        options: {
            workspaceId?: string;
            status?: string;
            limit?: number;
            offset?: number;
        } = {}
    ): Promise<ISubscription[]> {
        const query: Record<string, unknown> = {};
        if (options.workspaceId) query.workspaceId = unprefixId(options.workspaceId);
        if (options.status) query.status = options.status;

        const subscriptions = await (Subscription as any)
            .find(query)
            .sort({ createdAt: -1 })
            .limit(options.limit || 50)
            .skip(options.offset || 0);

        return subscriptions;
    }

    async count(options: { workspaceId?: string; status?: string } = {}): Promise<number> {
        const query: Record<string, unknown> = {};
        if (options.workspaceId) query.workspaceId = unprefixId(options.workspaceId);
        if (options.status) query.status = options.status;

        return await (Subscription as any).countDocuments(query);
    }

    async updateById(
        id: string,
        updateData: Partial<ISubscription>
    ): Promise<ISubscription | null> {
        return await (Subscription as any).findByIdAndUpdate(unprefixId(id), updateData, {
            new: true,
        });
    }

    async updateByStripeId(
        stripeSubscriptionId: string,
        updateData: Partial<ISubscription>
    ): Promise<ISubscription | null> {
        return await (Subscription as any).findOneAndUpdate({ stripeSubscriptionId }, updateData, {
            new: true,
        });
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await (Subscription as any).findByIdAndDelete(unprefixId(id));
        return !!result;
    }

    async findExpiringTrials(hoursFromNow: number = 24): Promise<ISubscription[]> {
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + hoursFromNow);

        return await (Subscription as any).find({
            status: 'trial',
            trialEnd: { $lte: futureDate, $gt: new Date() },
        });
    }

    async findEndingSubscriptions(hoursFromNow: number = 24): Promise<ISubscription[]> {
        const futureDate = new Date();
        futureDate.setHours(futureDate.getHours() + hoursFromNow);

        return await (Subscription as any).find({
            status: 'active',
            currentPeriodEnd: { $lte: futureDate, $gt: new Date() },
        });
    }
    async findSubscriptionsDueForRenewal(beforeDate: Date = new Date()): Promise<ISubscription[]> {
        return await (Subscription as any).find({
            status: 'active',
            currentPeriodEnd: { $lte: beforeDate },
        });
    }

    async findByStripeId(stripeSubscriptionId: string): Promise<ISubscription | null> {
        return await Subscription.findOne({
            stripeSubscriptionId: stripeSubscriptionId,
        });
    }
    async incrementFailure(stripeSubscriptionId: string): Promise<void> {
        await Subscription.updateOne(
            { stripeSubscriptionId },
            {
                $inc: { paymentFailureCount: 1 },
                $set: {
                    status: 'past_due',
                    updatedAt: new Date(),
                },
            }
        );
    }

    async deactivateOtherSubscriptions(
        workspaceId: string,
        excludeStripeSubId?: string
    ): Promise<void> {
        const query: any = {
            workspaceId: unprefixId(workspaceId),
            status: { $in: ['active', 'trialing', 'past_due'] },
        };

        if (excludeStripeSubId) {
            query.stripeSubscriptionId = { $ne: excludeStripeSubId };
        }

        await (Subscription as any).updateMany(query, {
            $set: {
                status: 'canceled',
                canceledAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }
}

export const subscriptionRepository = new SubscriptionRepository();
