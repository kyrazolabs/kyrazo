import { expect, test, describe } from 'bun:test';
import { subscriptionsJob } from './subscriptions.job';

describe('Subscriptions Job', () => {
    test('Should define the subscriptions auto-scaling CRON job', () => {
        expect(subscriptionsJob).toBeDefined();
    });
});
