export const getEventType = (body: any, headers?: Record<string, string>): string | undefined => {
    const triggerType = body?.triggerType;
    if (!triggerType) return undefined;

    return triggerType;
};
