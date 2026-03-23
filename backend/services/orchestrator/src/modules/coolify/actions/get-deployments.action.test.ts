import { expect, test, describe } from 'bun:test';
import { getDeployments } from './get-deployments.action';

describe('Get Deployments Action', () => {
    test('Should export get deployments function', () => {
        expect(getDeployments).toBeDefined();
        expect(typeof getDeployments).toBe('function');
    });
});
