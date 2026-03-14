import { expect, test, describe } from 'bun:test';
import * as actions from './index';

describe('Coolify Actions Index', () => {
    test('Should export all Coolify network actions', () => {
        expect(actions.fetchCoolify).toBeDefined();
        expect(actions.createGitHubApp).toBeDefined();
    });
});
