import * as stripe from './stripe';
import * as paypal from './paypal';
import * as github from './github';

export const serviceFilters: Record<
    string,
    { getEventType: (body: any, headers?: Record<string, string>) => string | undefined }
> = {
    stripe,
    paypal,
    github,
};

export const getServiceFilter = (serviceName: string) => {
    return serviceFilters[serviceName.toLowerCase()];
};
