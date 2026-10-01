import { expect, test, describe } from 'bun:test';
import { fetchCoolify } from './fetch-coolify.util';

describe('Fetch Coolify Util', () => {
    test('Should export fetch abstraction wrapper', () => {
        expect(fetchCoolify).toBeDefined();
        expect(typeof fetchCoolify).toBe('function');
    });
});
