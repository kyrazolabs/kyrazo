import { expect, test, describe } from 'bun:test';
import { WorkerService } from './worker.service';

describe('Worker Service', () => {
    test('Should export WorkerService class', () => {
        expect(WorkerService).toBeDefined();
        expect(typeof WorkerService).toBe('function');
    });
});
