export const getEventType = (body: any, headers?: Record<string, string>): string | undefined => {
    const githubEvent = headers?.['x-github-event'];
    if (!githubEvent) return undefined;

    const action = body?.action;
    return action ? `github.${githubEvent}.${action}` : `github.${githubEvent}`;
};
