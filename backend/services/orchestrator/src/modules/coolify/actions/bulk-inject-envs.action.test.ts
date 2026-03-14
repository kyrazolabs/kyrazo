import { expect, test, describe } from 'bun:test';
import { bulkInjectEnvs } from './bulk-inject-envs.action';

describe('Bulk Inject Envs Action', () => {
    test('Should export bulk inject mutation', () => {
        expect(bulkInjectEnvs).toBeDefined();
        expect(typeof bulkInjectEnvs).toBe('function');
    });
});
