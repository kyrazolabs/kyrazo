import { expect, test, describe } from 'bun:test';
import { config } from './config';

describe('Common Config', () => {
    test('Should export successfully parsed configuration schema', () => {
        expect(config).toBeDefined();
        // Just verify basic property existence
        expect(config.COOLIFY_API_URL).toBeDefined();
    });
});
