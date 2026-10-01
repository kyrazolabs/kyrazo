import { describe, it, expect } from "bun:test";
import { config } from "./app.config";

describe("AppConfig", () => {
    it("should have basic properties", () => {
        expect(config.redis).toBeDefined();
        expect(config.nats).toBeDefined();
    });
});
