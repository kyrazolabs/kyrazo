import * as stripe from './stripe';
import * as paypal from './paypal';

export const serviceFilters: Record<string, { getEventType: (body: any) => string | undefined }> = {
    stripe,
    paypal,
};

export const getServiceFilter = (serviceName: string) => {
    return serviceFilters[serviceName.toLowerCase()];
};
