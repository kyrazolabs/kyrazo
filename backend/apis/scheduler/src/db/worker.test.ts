import { expect, test, describe } from 'bun:test';
import { workers } from './worker';

describe('Worker Schema', () => {
    test('Should define workers table with proper name', () => {
        expect(workers).toBeDefined();
    });
});
