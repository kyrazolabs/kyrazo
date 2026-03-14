import { expect, test, describe } from 'bun:test';
import { app } from './index';

describe('Main Application Index', () => {
    test('Should export the main Hono application instance', () => {
        expect(app).toBeDefined();
    });
});
