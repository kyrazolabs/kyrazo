import { expect, test, describe } from 'bun:test';
import * as schema from './schema';

describe('Database Schema Exports', () => {
    test('Should export all schema components', () => {
        expect(schema).toBeDefined();
    });
});
