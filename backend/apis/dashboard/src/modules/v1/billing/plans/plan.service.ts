import { planRepository } from './plan.repo';
import { IPlan, logger } from '@kyrazo/shared';
import { CreatePlanInput, UpdatePlanInput } from './plan.dto';
import { stripe } from '@/configs/stripe';

export class PlanService {
    async createPlan(planData: CreatePlanInput): Promise<IPlan> {
        const existingPlan = await planRepository.exists(planData.slug);
        if (existingPlan) {
            throw new Error('Plan with this slug already exists');
        }

        try {
            // 1️⃣ Create Stripe Meter
            const meter = await stripe.billing.meters.create({
                display_name: `${planData.name} Events`,
                event_name: planData.meterEventName,
                default_aggregation: {
                    formula: 'sum',
                },
                customer_mapping: {
                    event_payload_key: 'stripe_customer_id',
                    type: 'by_id',
                },
                value_settings: {
                    event_payload_key: 'value',
                },
            });

            // const productId = config.stripe.mainProduct;
            // 2️⃣ Create Stripe Product
            const product = await stripe.products.create({
                description: 'Usage fees for Hypernian',
                name: 'Hypernian Usage',
            });

            // 2️⃣ Base subscription price
            const basePrice = await stripe.prices.create({
                product: product.id,
                unit_amount: planData.priceCents,
                currency: planData.currency.toLowerCase(),
                recurring: {
                    interval: planData.interval,
                    usage_type: 'licensed',
                },
                metadata: {
                    type: 'base',
                    planSlug: planData.slug,
                },
            });

            // Metered overage price (overage beyond included units)
            const overagePrice = await stripe.prices.create({
                product: product.id,
                currency: planData.currency.toLowerCase(),
                recurring: {
                    interval: planData.interval as 'month' | 'year',
                    usage_type: 'metered',
                    meter: meter.id, // Stripe Meter ID
                },
                billing_scheme: 'tiered',
                tiers_mode: 'graduated',
                tiers: [
                    {
                        up_to: planData.limits.eventsPerMonth,
                        unit_amount_decimal: '0',
                    }, // included in flat fee
                    {
                        up_to: 'inf',
                        unit_amount_decimal: planData.overagePriceCents.toString(),
                    },
                ],
            });

            logger.info(
                `Created Stripe product ${product.id}, base price ${basePrice.id}, metered price ${overagePrice.id}`
            );

            // 4️⃣ Persist internally
            return await planRepository.create({
                ...planData,
                stripeProductId: product.id,
                stripePriceId: basePrice.id,
                stripeMeteredPriceId: overagePrice.id,
                stripeMeterId: meter.id,
                stripeMeterEventName: planData.meterEventName,
            });
        } catch (error: any) {
            logger.error('Failed to create Stripe plan', error);
            throw new Error('Failed to create payment configuration for plan');
        }
    }

    async getPlanById(id: string): Promise<IPlan | null> {
        return await planRepository.findById(id);
    }

    async getPlanBySlug(slug: string): Promise<IPlan | null> {
        return await planRepository.findBySlug(slug);
    }

    async getActivePlans(): Promise<IPlan[]> {
        return await planRepository.findActivePlans();
    }

    async getAllPlans(
        options: { active?: boolean; limit?: number; offset?: number } = {}
    ): Promise<{
        plans: IPlan[];
        total: number;
    }> {
        const [plans, total] = await Promise.all([
            planRepository.findAll(options),
            planRepository.count(options),
        ]);

        return { plans, total };
    }

    async updatePlan(id: string, updateData: UpdatePlanInput): Promise<IPlan | null> {
        // If slug is being updated, check for uniqueness
        if (updateData.slug) {
            const existingPlan = await planRepository.exists(updateData.slug);
            if (existingPlan) {
                // Check if it's not the same plan
                const currentPlan = await planRepository.findById(id);
                if (currentPlan && currentPlan.slug !== updateData.slug) {
                    throw new Error('Plan with this slug already exists');
                }
            }
        }

        return await planRepository.updateById(id, updateData);
    }

    async deletePlan(id: string): Promise<boolean> {
        // Check if plan is being used by any active subscriptions
        // This would require checking subscriptions, but for now we'll allow deletion
        // In a real implementation, you'd want to prevent deletion of plans in use
        return await planRepository.deleteById(id);
    }

    async togglePlanStatus(id: string): Promise<IPlan | null> {
        const plan = await planRepository.findById(id);
        if (!plan) {
            return null;
        }

        return await planRepository.updateById(id, {
            isActive: !plan.isActive,
        });
    }

    async regenerateStripePrice(id: string): Promise<IPlan | null> {
        const plan = await planRepository.findById(id);
        if (!plan) {
            throw new Error('Plan not found');
        }

        try {
            // Create new Stripe price for this plan
            const stripePrice = await stripe.prices.create({
                unit_amount: plan.priceCents,
                currency: plan.currency.toLowerCase(),
                recurring: {
                    interval: plan.interval,
                },
                product_data: {
                    name: plan.name,
                },
                metadata: {
                    planSlug: plan.slug,
                    regenerated: 'true',
                },
            });

            logger.info(
                `Regenerated Stripe price ${stripePrice.id} for existing plan ${plan.slug}`
            );

            // Update the plan with the new Stripe price ID
            return await planRepository.updateById(id, {
                stripePriceId: stripePrice.id,
            });
        } catch (error: any) {
            logger.error('Failed to regenerate Stripe price for plan:', error);
            throw new Error('Failed to regenerate payment configuration for plan');
        }
    }

    async fixAllPlansWithoutStripePrices(): Promise<{
        fixed: number;
        errors: number;
    }> {
        const plans = await planRepository.findAll({ active: true });
        let fixed = 0;
        let errors = 0;

        for (const plan of plans) {
            if (!plan.stripePriceId) {
                try {
                    await this.regenerateStripePrice(plan._id.toString());
                    fixed++;
                    logger.info(`Fixed plan ${plan.slug} with new Stripe price`);
                } catch (error: any) {
                    errors++;
                    logger.error(`Failed to fix plan ${plan.slug}:`, error);
                }
            }
        }

        return { fixed, errors };
    }
}

export const planService = new PlanService();
