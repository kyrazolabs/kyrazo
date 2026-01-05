import { WebhookType } from "@/types/events";

export class DispatcherValidator {
    private static instance: DispatcherValidator;

    private constructor() {}

    public static getInstance(): DispatcherValidator {
        if (!DispatcherValidator.instance) {
            DispatcherValidator.instance = new DispatcherValidator();
        }
        return DispatcherValidator.instance;
    }
    /**
     * @title Check if event should be processed based on webhook type
     * @param webhookType The type to be compared to the type required
     * @param requiredType The type to be compared
     */
    public shouldProcess(
        webhookType: WebhookType,
        requiredType?: WebhookType,
    ): boolean {
        // If no required type specified, process all types
        if (!requiredType) {
            return true;
        }

        // For backward compatibility, exact match
        if (webhookType === requiredType) {
            return true;
        }

        // For receive events, also accept any event type starting with 'receive.'
        if (
            requiredType === WebhookType.RECEIVE &&
            webhookType.toString().startsWith("receive.")
        ) {
            return true;
        }

        return false;
    }

    /**
     * Validate event structure
     */
    public validate(event: any): boolean {
        if (!event) {
            console.log("Event is null or undefined");
            return false;
        }

        if (!event.eventId) {
            console.log("Event missing eventId");
            return false;
        }

        if (!event.workspaceId) {
            console.log("Event missing workspaceId");
            return false;
        }

        if (event.webhookType === "publish") {
            if (!event.projectId) {
                console.log("Event missing projectId");
                return false;
            }
            if (!event.eventType) {
                console.log("Event missing eventType");
                return false;
            }
            if (!event.data) {
                console.log("Event missing data");
                return false;
            }
        }

        if (event.webhookType === "receive") {
            if (!event.headers) {
                console.log("Event missing header");
                return false;
            }
            if (!event.body) {
                console.log("Event missing body");
                return false;
            }
        }

        return true;
    }
}

export const dispatcherValidator = DispatcherValidator.getInstance();
