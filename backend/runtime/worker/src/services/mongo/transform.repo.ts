import { Transform, RedisKeys, type ITransform, logger, unprefixId } from '@kyrazo/shared';
import { redisConfig } from '@/config';

/**
 * Transform Repository
 * Handles fetching and caching of custom transformers.
 * Follows REDIS_KEYS_RULES.md for key naming.
 */
export class TransformRepository {
    private static instance: TransformRepository;

    private constructor() {}

    public static getInstance(): TransformRepository {
        if (!TransformRepository.instance) {
            TransformRepository.instance = new TransformRepository();
        }
        return TransformRepository.instance;
    }

    /**
     * Get the active transformer for a namespace with Redis caching.
     * Cache Key: context:transform:active:{workspaceId}:{namespaceId}
     */
    public async getActiveTransformer(
        workspaceId: string,
        namespaceId: string
    ): Promise<ITransform | null> {
        const cacheKey = RedisKeys.context.activeTransform(workspaceId, namespaceId);

        try {
            // 1. Try Redis cache
            const cached = await redisConfig.get(cacheKey);
            if (cached) {
                logger.debug(`[TransformRepo] Cache hit for namespace: ${namespaceId}`);
                return JSON.parse(cached);
            }

            // 2. Cache miss, query MongoDB
            logger.debug(`[TransformRepo] Cache miss for namespace: ${namespaceId}, querying DB...`);
            const activeTransforms = await Transform.findActive(workspaceId, namespaceId);
            const transform = activeTransforms.length > 0 ? activeTransforms[0] : null;

            if (transform) {
                // 3. Store in Redis (1 hour TTL)
                // We store the full JSON because it's used in every event dispatch
                await redisConfig.set(cacheKey, JSON.stringify(transform), 3600);
            } else {
                // Cache the absence of transformer for a shorter period (negative caching)
                await redisConfig.set(cacheKey, 'null', 300); // 5 mins
                return null;
            }

            return transform;
        } catch (error: any) {
            logger.error(`[TransformRepo] Error fetching active transformer: ${error.message}`);
            return null; // Fallback to no transformation on DB/Redis error
        }
    }
    /**
     * Get a specific transformer by ID with Redis caching.
     * Cache Key: context:transform:code:{id}
     */
    public async getTransformerById(id: string): Promise<ITransform | null> {
        const cacheKey = RedisKeys.context.transformCode(id);

        try {
            // 1. Try Redis cache
            const cached = await redisConfig.get(cacheKey);
            if (cached) {
                logger.debug(`[TransformRepo] Cache hit for transformer: ${id}`);
                return JSON.parse(cached);
            }

            // 2. Cache miss, query MongoDB
            logger.debug(`[TransformRepo] Cache miss for transformer: ${id}, querying DB...`);
            const transform = await Transform.findById(unprefixId(id));

            if (transform) {
                // 3. Store in Redis (24 hour TTL for code snapshots)
                await redisConfig.set(cacheKey, JSON.stringify(transform), 86400);
            } else {
                // Cache the absence for a shorter period
                await redisConfig.set(cacheKey, 'null', 300);
                return null;
            }

            return transform as any;
        } catch (error: any) {
            logger.error(`[TransformRepo] Error fetching transformer ${id}: ${error.message}`);
            return null;
        }
    }
}

export const transformRepository = TransformRepository.getInstance();
