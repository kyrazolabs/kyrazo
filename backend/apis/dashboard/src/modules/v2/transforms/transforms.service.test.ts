import { describe, it, expect, mock, beforeEach, spyOn } from 'bun:test';
import { transformService } from './transforms.service';
import { transformRepository } from './transforms.repo';

describe('TransformService', () => {
    beforeEach(() => {
        mock.restore();
    });

    describe('validateCode', () => {
        it('should block dangerous patterns', () => {
            const forbidden = [
                'eval("hack")',
                'new Function("hack")',
                'process.exit(1)',
                'require("fs")',
                'import("fs")',
                'setTimeout(() => {}, 0)',
                'global.something = 1',
                'obj.__proto__',
                'String.prototype.xxx = 1'
            ];

            for (const code of forbidden) {
                const result = transformService.validateCode(code);
                expect(result.valid).toBe(false);
                expect(result.error).toContain('Dangerous code');
            }
        });

        it('should allow safe code', () => {
            const safe = 'event.foo = "bar"; return event;';
            const result = transformService.validateCode(safe);
            expect(result.valid).toBe(true);
        });
    });

    describe('testTransform', () => {
        it('should successfully transform a payload', async () => {
            const code = 'event.count = event.count + 1; return event;';
            const payload = { count: 10 };
            
            const result = await transformService.testTransform(code, payload);
            
            expect(result.result.count).toBe(11);
            expect(result.executionTimeMs).toBeGreaterThan(0);
        });

        it('should capture console logs', async () => {
            const code = 'console.log("hello"); console.info("world"); return event;';
            const result = await transformService.testTransform(code, {});
            
            expect(result.logs).toContain('hello');
            expect(result.logs).toContain('INFO: world');
        });

        it('should catch runtime errors', async () => {
            const code = 'throw new Error("Boom");';
            const result = await transformService.testTransform(code, {});
            
            expect(result.result).toBeNull();
            expect(result.logs).toContain('Runtime Error: Boom');
        });

        it('should provide crypto utilities', async () => {
            const code = 'return crypto.sha256("test");';
            const result = await transformService.testTransform(code, {});
            expect(result.result).toHaveLength(64); // SHA-256 hex length
        });
        
        it('should provide lodash utilities', async () => {
            const code = 'return lodash.get(event, "a.b");';
            const result = await transformService.testTransform(code, { a: { b: 42 } });
            expect(result.result).toBe(42);
        });
    });

    describe('createTransform', () => {
        it('should throw if code is dangerous', async () => {
            const input = { name: 'Bad', code: 'eval("x")' };
            try {
                await transformService.createTransform(input as any, 'u1', 'w1', 'n1');
                expect().unreachable();
            } catch (e: any) {
                expect(e.message).toContain('Dangerous code');
            }
        });
    });
});
