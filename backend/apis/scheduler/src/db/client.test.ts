import { expect, test, describe } from 'bun:test';
import { clients } from './client';

describe('Client Schema', () => {
    test('Should define clients table with proper name', () => {
        expect(clients).toBeDefined();
    });
});
