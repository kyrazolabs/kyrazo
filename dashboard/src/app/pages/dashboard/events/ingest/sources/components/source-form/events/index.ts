import { STRIPE_EVENTS } from './stripe.events';
import { GITHUB_EVENTS } from './github.events';
import { PAYPAL_EVENTS } from './paypal.events';
import { SHOPIFY_EVENTS } from './shopify.events';
import { WEBFLOW_EVENTS } from './webflow.events';
import { SLACK_EVENTS } from './slack.events';

export const COMMON_EVENT_TYPES: Record<string, string[]> = {
    stripe: STRIPE_EVENTS,
    github: GITHUB_EVENTS,
    paypal: PAYPAL_EVENTS,
    shopify: SHOPIFY_EVENTS,
    webflow: WEBFLOW_EVENTS,
    slack: SLACK_EVENTS,
};
