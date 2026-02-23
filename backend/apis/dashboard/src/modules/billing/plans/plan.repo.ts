import { Plan, IPlan, unprefixId } from '@kyrazo/shared';

export class PlanRepository {
    async create(planData: Partial<IPlan>): Promise<IPlan> {
        const plan = new Plan(planData);
        return await plan.save();
    }

    async findById(id: string): Promise<IPlan | null> {
        return await Plan.findById(unprefixId(id));
    }

    async findBySlug(slug: string): Promise<IPlan | null> {
        return await Plan.findBySlug(slug);
    }

    async findActivePlans(): Promise<IPlan[]> {
        return await Plan.findActivePlans();
    }

    async findAll(
        options: { active?: boolean; limit?: number; offset?: number } = {}
    ): Promise<IPlan[]> {
        const query: Record<string, unknown> = {};
        if (options.active !== undefined) {
            query.isActive = options.active;
        }

        const plans = await Plan.find(query)
            .sort({ createdAt: -1 })
            .limit(options.limit || 50)
            .skip(options.offset || 0);

        return plans;
    }

    async count(options: { active?: boolean } = {}): Promise<number> {
        const query: Record<string, unknown> = {};
        if (options.active !== undefined) {
            query.isActive = options.active;
        }

        return await Plan.countDocuments(query);
    }

    async updateById(id: string, updateData: Partial<IPlan>): Promise<IPlan | null> {
        return await Plan.findByIdAndUpdate(unprefixId(id), updateData, { new: true });
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await Plan.findByIdAndDelete(unprefixId(id));
        return !!result;
    }

    async exists(slug: string): Promise<boolean> {
        const count = await Plan.countDocuments({ slug });
        return count > 0;
    }

    async getPlanByStripePrice(stripePriceId: string): Promise<IPlan | null> {
        return await Plan.findOne({ stripePriceId: stripePriceId });
    }
}

export const planRepository = new PlanRepository();
