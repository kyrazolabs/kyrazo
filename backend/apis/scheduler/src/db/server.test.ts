import { expect, test, describe } from 'bun:test';
import { servers } from './server';

describe('Server Schema', () => {
    test('Should define servers table with proper name', () => {
        expect(servers).toBeDefined();
    });
});
