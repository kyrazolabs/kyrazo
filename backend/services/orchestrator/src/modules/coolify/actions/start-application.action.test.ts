import { expect, test, describe } from 'bun:test';
import { startApplication } from './start-application.action';

describe('Start Application Action', () => {
    test('Should export start application mutation', () => {
        expect(startApplication).toBeDefined();
        expect(typeof startApplication).toBe('function');
    });
});
