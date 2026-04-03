import { describe, it, expect } from "vitest";
import { createErrorFromResponse } from "../src/errors";
import {
  AuthenticationError,
  ValidationError,
  RateLimitError,
  NotFoundError,
  ForbiddenError,
  ServerError,
  LimitExceededError,
  KyrazoError,
} from "../src/errors";

describe("Error Mapping Logic", () => {
  it("should map UNAUTHORIZED code to AuthenticationError", () => {
    const error = createErrorFromResponse(401, {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Invalid key", requestId: "req_1" },
    });
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.requestId).toBe("req_1");
    expect(error.statusCode).toBe(401);
  });

  it("should map RATE_LIMIT_EXCEEDED code to RateLimitError with retry info", () => {
    const error = createErrorFromResponse(429, {
      success: false,
      error: { 
        code: "RATE_LIMIT_EXCEEDED", 
        message: "Too fast", 
        retryAfter: 30,
        remainingRequests: 0,
        requestId: "req_2"
      },
    });
    expect(error).toBeInstanceOf(RateLimitError);
    const rateErr = error as RateLimitError;
    expect(rateErr.retryAfter).toBe(30);
    expect(rateErr.remainingRequests).toBe(0);
  });

  it("should capture retry info from headers if missing in body", () => {
    const headers = new Headers({
      "Retry-After": "45",
      "X-RateLimit-Remaining": "5"
    });
    const error = createErrorFromResponse(429, {
      success: false,
      error: { code: "RATE_LIMIT_EXCEEDED", message: "Too fast" },
    }, "req_3", headers);
    
    expect(error).toBeInstanceOf(RateLimitError);
    const rateErr = error as RateLimitError;
    expect(rateErr.retryAfter).toBe(45);
    expect(rateErr.remainingRequests).toBe(5);
  });

  it("should map VALIDATION_ERROR and capture details", () => {
    const details = [{ field: "email", reason: "invalid" }];
    const error = createErrorFromResponse(400, {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Bad input", details },
    });
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).details).toEqual(details);
  });

  it("should map LIMIT_EXCEEDED code to LimitExceededError", () => {
    const error = createErrorFromResponse(403, {
      success: false,
      error: { code: "LIMIT_EXCEEDED", message: "Plan limit" },
    });
    expect(error).toBeInstanceOf(LimitExceededError);
    expect(error.statusCode).toBe(403);
  });

  it("should handle custom error codes by falling back to status code", () => {
    const error = createErrorFromResponse(404, {
      success: false,
      error: { code: "CUSTOM_NOT_FOUND", message: "Not here" },
    });
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.code).toBe("CUSTOM_NOT_FOUND");
  });

  it("should handle completely malformed responses", () => {
    const error = createErrorFromResponse(500, null, "req_99");
    expect(error).toBeInstanceOf(ServerError);
    expect(error.requestId).toBe("req_99");
  });

  it("should recognize backend typos like UNAUTORIZED_USER", () => {
    const error = createErrorFromResponse(401, {
      success: false,
      error: { code: "UNAUTORIZED_USER", message: "Typo" },
    });
    expect(error).toBeInstanceOf(AuthenticationError);
  });
});
