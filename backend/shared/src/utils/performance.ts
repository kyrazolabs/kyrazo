import { logger } from '../configs';

/**
 * Performance timer utility
 */
export class PerformanceTimer {
    private startTime: number;
    private label: string;

    constructor(label: string) {
        this.label = label;
        this.startTime = performance.now();
    }

    /**
     * End timer and log the duration
     */
    end(): number {
        const duration = performance.now() - this.startTime;
        logger.debug(`Performance: ${this.label} took ${duration.toFixed(2)}ms`);
        return duration;
    }

    /**
     * Get current duration without ending the timer
     */
    getCurrentDuration(): number {
        return performance.now() - this.startTime;
    }
}

/**
 * Measure execution time of a function
 */
export async function measureAsync<T>(
    label: string,
    fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
    const timer = new PerformanceTimer(label);
    const result = await fn();
    const duration = timer.end();
    return { result, duration };
}

/**
 * Measure execution time of a synchronous function
 */
export function measure<T>(label: string, fn: () => T): { result: T; duration: number } {
    const timer = new PerformanceTimer(label);
    const result = fn();
    const duration = timer.end();
    return { result, duration };
}

/**
 * Simple performance decorator
 */
export function timed(label?: string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const timerLabel = label || `${target.constructor.name}.${propertyKey}`;

        descriptor.value = async function (...args: any[]) {
            const timer = new PerformanceTimer(timerLabel);
            try {
                const result = await originalMethod.apply(this, args);
                timer.end();
                return result;
            } catch (error: any) {
                timer.end();
                throw error;
            }
        };

        return descriptor;
    };
}

/**
 * Track API response times
 */
export function trackResponseTime(req: any, res: any, next: any) {
    const startTime = performance.now();

    res.on('finish', () => {
        const duration = performance.now() - startTime;
        logger.info(`API Response Time: ${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
    });

    next();
}
