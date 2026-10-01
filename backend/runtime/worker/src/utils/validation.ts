export function validateMessage(message: any): boolean {
    return (
        message &&
        typeof message === "object" &&
        message.event &&
        message.signature &&
        message.timestamp &&
        message.nonce
    );
}
