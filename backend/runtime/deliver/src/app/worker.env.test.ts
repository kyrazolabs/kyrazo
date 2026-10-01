import { describe, it, expect } from 'bun:test';
import { env } from './worker.env';

describe('WorkerEnv', () => {
    it('should have required environment variables or defaults', () => {
        expect(env.worker).toBeDefined();
    });
});
