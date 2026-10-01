import { describe, it, expect } from 'bun:test';
import { serviceFilters } from './index';

describe('Service Filters', () => {
    describe('Shopify', () => {
        it('should extract event type from x-shopify-topic', () => {
            const headers = { 'x-shopify-topic': 'orders/create' };
            const type = serviceFilters.shopify!.getEventType({}, headers);
            expect(type).toBe('orders.create');
        });

        it('should return undefined if header is missing', () => {
            const type = serviceFilters.shopify!.getEventType({}, {});
            expect(type).toBe(undefined);
        });
    });

    describe('Slack', () => {
        it('should extract event type from body.event.type', () => {
            const body = { type: 'event_callback', event: { type: 'message' } };
            const type = serviceFilters.slack!.getEventType(body);
            expect(type).toBe('message');
        });

        it('should extract event type from body.type (url_verification)', () => {
            const body = { type: 'url_verification' };
            const type = serviceFilters.slack!.getEventType(body);
            expect(type).toBe('url_verification');
        });
    });

    describe('Webflow', () => {
        it('should extract event type from body.triggerType', () => {
            const body = { triggerType: 'form_submission' };
            const type = serviceFilters.webflow!.getEventType(body);
            expect(type).toBe('form_submission');
        });
    });

    describe('GitHub', () => {
        it('should extract event type from x-github-event and action', () => {
            const headers = { 'x-github-event': 'push' };
            const type = serviceFilters.github!.getEventType({}, headers);
            expect(type).toBe('push');
        });

        it('should include action if present', () => {
            const headers = { 'x-github-event': 'pull_request' };
            const body = { action: 'opened' };
            const type = serviceFilters.github!.getEventType(body, headers);
            expect(type).toBe('pull_request.opened');
        });
    });
});
