import { expect, test, describe } from 'bun:test';
import { WorkerRepo } from './worker.repo';

describe('Worker Repository', () => {
    test('Should export WorkerRepo database logic class', () => {
        expect(WorkerRepo).toBeDefined();
        expect(typeof WorkerRepo).toBe('function');
    });
});
