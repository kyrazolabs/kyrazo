import { describe, expect, it } from 'bun:test';
import { sandboxExecutor } from './sandbox.executor';

describe('SandboxExecutor', () => {
    it('should successfully transform a payload', async () => {
        const code = `
            payload.modified = true;
            payload.count = payload.count + 1;
            return payload;
        `;
        const payload = { count: 10 };
        const result = await sandboxExecutor.execute(code, payload);

        expect(result.success).toBe(true);
        expect(result.result.modified).toBe(true);
        expect(result.result.count).toBe(11);
    });

    it('should timeout after 2 seconds', async () => {
        const code = `
            const start = Date.now();
            while (Date.now() - start < 3000) {
                // Spinning for 3 seconds
            }
            return payload;
        `;
        const payload = { foo: 'bar' };
        const result = await sandboxExecutor.execute(code, payload);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Timed Out');
    }, 5000); // 5s test timeout

    it('should provide lodash and dayjs utilities', async () => {
        const code = `
            payload.hasId = lodash.has(payload, 'id');
            payload.formattedDate = dayjs('2024-01-01').format('YYYY');
            return payload;
        `;
        const payload = { id: 1 };
        const result = await sandboxExecutor.execute(code, payload);

        expect(result.success).toBe(true);
        expect(result.result.hasId).toBe(true);
        expect(result.result.formattedDate).toBe('2024');
    });

    it('should provide safe crypto utilities', async () => {
        const code = `
            payload.hash = crypto.sha256('hello');
            payload.hmac = crypto.hmac('key', 'data');
            return payload;
        `;
        const payload = {};
        const result = await sandboxExecutor.execute(code, payload);

        expect(result.success).toBe(true);
        expect(result.result.hash).toBeDefined();
        expect(result.result.hmac).toBeDefined();
    });

    it('should capture logs in test mode', async () => {
        // Enforce test mode for this test
        process.env.SANDBOX_TEST_MODE = 'true';
        const code = `
            console.log('Hello from sandbox');
            console.warn('Warning here');
            return payload;
        `;
        const payload = {};
        const result = await sandboxExecutor.execute(code, payload);

        expect(result.success).toBe(true);
        expect(result.logs).toContain('Hello from sandbox');
        expect(result.logs).toContain('WARN: Warning here');
        delete process.env.SANDBOX_TEST_MODE;
    });

    it('should catch runtime errors', async () => {
        const code = `
            throw new Error('Boom');
        `;
        const payload = {};
        const result = await sandboxExecutor.execute(code, payload);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Boom');
    });

    it('should block access to dangerous globals', async () => {
        const code = `
            try {
                return { process: !!process };
            } catch (e) {
                return { error: 'Blocked' };
            }
        `;
        const payload = {};
        const result = await sandboxExecutor.execute(code, payload);

        // It should either return { process: false } or throw ReferenceError
        if (result.success) {
            expect(result.result.process).toBe(false);
        } else {
            expect(result.error).toContain('process');
        }
    });
});
