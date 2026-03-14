import { expect, test, describe } from 'bun:test';
import { globalErrorHandler } from './error';

describe('Common Error Handler', () => {
    test('Should export globalErrorHandler utility', () => {
        expect(globalErrorHandler).toBeDefined();
    });
});
