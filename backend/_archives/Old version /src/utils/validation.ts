export function validateMessage(message: any): boolean {
    return (
        message &&
        typeof message === "object" &&
        message.event &&
        message.signature &&
        message.timestamp &&
        message.nonce &&
        message.event.eventId &&
        message.event.workspaceId &&
        message.event.eventType &&
        message.event.data
    );
}
