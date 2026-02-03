import { describe, it, expect, beforeEach } from "bun:test";
import { DispatcherValidator } from "./dispatcher.validator";
import { WebhookType } from "@/types/events";

describe("DispatcherValidator", () => {
    let validator: DispatcherValidator;

    beforeEach(() => {
        validator = DispatcherValidator.getInstance();
    });

    it("should be a singleton", () => {
        const instance1 = DispatcherValidator.getInstance();
        const instance2 = DispatcherValidator.getInstance();
        expect(instance1).toBe(instance2);
    });

    describe("shouldProcess", () => {
        it("should return true if no required type is specified", () => {
            expect(validator.shouldProcess(WebhookType.PUBLISH)).toBe(true);
        });

        it("should return true for exact match", () => {
            expect(
                validator.shouldProcess(
                    WebhookType.PUBLISH,
                    WebhookType.PUBLISH,
                ),
            ).toBe(true);
        });

        it("should return true for receive events starting with receive.", () => {
            // Mocking WebhookType as string for this test case if needed, but assuming enum structure
            expect(
                validator.shouldProcess(
                    "receive.test" as any,
                    WebhookType.RECEIVE,
                ),
            ).toBe(true);
        });

        it("should return false for mismatch", () => {
            expect(
                validator.shouldProcess(
                    WebhookType.PUBLISH,
                    WebhookType.RECEIVE,
                ),
            ).toBe(false);
        });
    });

    describe("validate", () => {
        it("should return false for null event", () => {
            expect(validator.validate(null)).toBe(false);
        });

        it("should return false if eventId is missing", () => {
            expect(validator.validate({ workspaceId: "123" })).toBe(false);
        });

        it("should return false if workspaceId is missing", () => {
            expect(validator.validate({ eventId: "123" })).toBe(false);
        });

        it("should validate publish events correctly", () => {
            const validEvent = {
                eventId: "1",
                workspaceId: "2",
                webhookType: "publish",
                projectId: "3",
                eventType: "test",
                data: {},
            };
            expect(validator.validate(validEvent)).toBe(true);

            expect(
                validator.validate({ ...validEvent, projectId: undefined }),
            ).toBe(false);
        });
    });
});
