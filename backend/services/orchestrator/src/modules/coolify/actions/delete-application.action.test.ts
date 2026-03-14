import { expect, test, describe } from 'bun:test';
import { deleteApplication } from './delete-application.action';

describe('Delete Application Action', () => {
    test('Should export delete application mutation', () => {
        expect(deleteApplication).toBeDefined();
        expect(typeof deleteApplication).toBe('function');
    });
});
