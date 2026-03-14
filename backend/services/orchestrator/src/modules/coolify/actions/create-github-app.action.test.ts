import { expect, test, describe } from 'bun:test';
import { createGitHubApp } from './create-github-app.action';

describe('Create GitHub App Action', () => {
    test('Should export create application mutation', () => {
        expect(createGitHubApp).toBeDefined();
        expect(typeof createGitHubApp).toBe('function');
    });
});
