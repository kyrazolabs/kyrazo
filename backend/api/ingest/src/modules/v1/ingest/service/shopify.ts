export const getEventType = (body: any, headers?: Record<string, string>): string | undefined => {
    const topic = headers?.['x-shopify-topic'];
    if (!topic) return undefined;

    return topic.replace(/\//g, '.');
};
