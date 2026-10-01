import { expect, test, describe } from 'bun:test';
import { getApplications } from './get-applications.action';

describe('Get Applications Action', () => {
    test('Should export get applications query', () => {
        expect(getApplications).toBeDefined();
        expect(typeof getApplications).toBe('function');
    });
});
