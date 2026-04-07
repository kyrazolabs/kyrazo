import { redisConfig } from "@/config";
import Redis from "ioredis";

export abstract class BaseProducer {
    protected get redis(): Redis {
        return redisConfig.getClient();
    }

    protected getMinuteBucket(date: Date | string = new Date()): string {
        const d = new Date(date);
        d.setSeconds(0, 0);
        // Replace colons with dashes to avoid Redis key parsing issues
        return d.toISOString().replace(/:/g, "-");
    }
}
