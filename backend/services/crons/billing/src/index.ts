import {
  Subscription,
  Plan,
  logger,
  databaseConfig,
  unprefixId,
  FREE_PLAN_LIMITS,
  mongoose,
  RedisKeys,
} from "@kyrazo/shared";
import Redis from "ioredis";
import * as dotenv from "dotenv";
import { Types } from "mongoose";

dotenv.config();

// Redis connection for cache invalidation
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

async function revertToFreePlan(
  workspaceId: string,
  userId: string,
  oldPeriodEnd: Date,
) {
  const freePlan = await Plan.findOne({ slug: "free" });
  if (!freePlan) {
    logger.error(`Free plan not found for workspace ${workspaceId}`);
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const workspaceIdObj = new Types.ObjectId(unprefixId(workspaceId));

    // 1. Deactivate all other active subscriptions
    await Subscription.updateMany(
      {
        workspaceId: workspaceIdObj,
        status: { $in: ["active", "trialing", "past_due"] },
      },
      {
        $set: {
          status: "canceled",
          canceledAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { session },
    );

    const now = new Date();
    const periodStart = oldPeriodEnd > now ? oldPeriodEnd : now;
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await Subscription.create(
      [
        {
          workspaceId: workspaceIdObj,
          userId: new Types.ObjectId(unprefixId(userId)),
          planId: freePlan._id,
          planSnapshot: {
            planId: freePlan._id,
            name: freePlan.name,
            slug: freePlan.slug,
            priceCents: freePlan.priceCents,
            currency: freePlan.currency,
            interval: freePlan.interval,
            features: freePlan.features,
            limits: freePlan.limits || FREE_PLAN_LIMITS,
            benefits: freePlan.benefits,
            stripeProductId: freePlan.stripeProductId,
            stripePriceId: freePlan.stripePriceId,
            createdAt: now,
          },
          status: "active",
          billingCycleAnchor: periodStart,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          quantity: 1,
        },
      ],
      { session },
    );

    await session.commitTransaction();

    // 3. Invalidate Redis cache
    await redis.del(RedisKeys.billing.subscription(workspaceId));
    await redis.del(RedisKeys.billing.workspacePlan(workspaceId));

    logger.info(`Successfully reverted workspace ${workspaceId} to free plan`);
  } catch (error: any) {
    await session.abortTransaction();
    logger.error(
      `Failed to revert workspace ${workspaceId} to free plan: ${error.message}`,
    );
  } finally {
    session.endSession();
  }
}

async function runCron() {
  logger.info("Starting billing cron job...");

  try {
    await databaseConfig.connect();

    const now = new Date();

    // Find subscriptions that are active but have passed their current period end
    // AND they are not supposed to renew (or Stripe failed to renew them)
    const expiredSubscriptions = await Subscription.find({
      status: "active",
      currentPeriodEnd: { $lte: now },
    });

    logger.info(
      `Found ${expiredSubscriptions.length} expired subscriptions to process`,
    );

    for (const sub of expiredSubscriptions) {
      await revertToFreePlan(
        sub.workspaceId.toString(),
        sub.userId.toString(),
        sub.currentPeriodEnd,
      );
    }

    logger.info("Billing cron job completed successfully");
  } catch (error: any) {
    logger.error(`Billing cron job failed: ${error.message}`);
  } finally {
    await databaseConfig.disconnect();
    redis.disconnect();
    process.exit(0);
  }
}

runCron();
