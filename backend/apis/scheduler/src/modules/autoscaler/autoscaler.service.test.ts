import { expect, test, describe } from 'bun:test';
import { AutoScalerService } from './autoscaler.service';

describe('Autoscaler Service', () => {
    test('Should export AutoScalerService class', () => {
        expect(AutoScalerService).toBeDefined();
        expect(typeof AutoScalerService).toBe('function');
    });
});
