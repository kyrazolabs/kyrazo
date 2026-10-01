import * as stripe from './stripe';
import * as paypal from './paypal';
import * as github from './github';
import * as shopify from './shopify';
import * as slack from './slack';
import * as webflow from './webflow';

export const serviceFilters: Record<
    string,
    { getEventType: (body: any, headers?: Record<string, string>) => string | undefined }
> = {
    stripe,
    paypal,
    github,
    shopify,
    slack,
    webflow,
};

export const getServiceFilter = (serviceName: string) => {
    return serviceFilters[serviceName.toLowerCase()];
};
