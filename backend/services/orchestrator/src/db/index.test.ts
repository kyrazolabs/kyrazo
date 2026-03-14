import { expect, test, describe } from 'bun:test';
import { db } from './index';

describe('Database Index', () => {
    test('Should export instantiated db connection', () => {
        expect(db).toBeDefined();
    });
});
