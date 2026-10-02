export const getEventType = (body: any, headers?: Record<string, string>): string | undefined => {
    const eventType = body?.event?.type || body?.type;
    if (!eventType) return undefined;

    return eventType;
};
