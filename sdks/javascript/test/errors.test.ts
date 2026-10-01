import { describe, it, expect } from "vitest";
import {
  createErrorFromResponse,
  AuthenticationError,
  ForbiddenError,
  ValidationError,
  NotFoundError,
  LimitExceededError,
  ServerError,
  ConflictError,
  KyrazoError,
} from "../src/errors";

describe("Error Mapping", () => {
  it("should map 401 Unauthorized to AuthenticationError", () => {
    const error = createErrorFromResponse(401, {
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized", requestId: "req-1" },
    });
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("should map specific auth codes to AuthenticationError", () => {
    const error = createErrorFromResponse(401, {
      success: false,
      error: { code: "INVALID_TOKEN", message: "Invalid token", requestId: "req-2" },
    });
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.code).toBe("INVALID_TOKEN");
  });

  it("should map 403 Forbidden with permissions code to ForbiddenError", () => {
    const error = createErrorFromResponse(403, {
      success: false,
      error: { code: "INSUFFICIENT_PERMISSIONS", message: "Forbidden", requestId: "req-3" },
    });
    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error.code).toBe("INSUFFICIENT_PERMISSIONS");
  });

  it("should map 403 Forbidden with limit code to LimitExceededError", () => {
    const error = createErrorFromResponse(403, {
      success: false,
      error: { code: "LIMIT_EXCEEDED", message: "Limit reached", requestId: "req-4" },
    });
    expect(error).toBeInstanceOf(LimitExceededError);
    expect(error.code).toBe("LIMIT_EXCEEDED");
  });

  it("should map 409 Conflict to ConflictError", () => {
    const error = createErrorFromResponse(409, {
      success: false,
      error: { code: "IDEMPOTENCY_CONFLICT", message: "Conflict", requestId: "req-5" },
    });
    expect(error).toBeInstanceOf(ConflictError);
    expect(error.code).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("should map 400 Validation to ValidationError", () => {
    const error = createErrorFromResponse(400, {
      success: false,
      error: {
        code: "INVALID_PAYLOAD",
        message: "Invalid",
        details: { field: "missing" },
        requestId: "req-6",
      },
    });
    expect(error).toBeInstanceOf(ValidationError);
    expect((error as ValidationError).details).toEqual({ field: "missing" });
  });

  it("should map specific Failure codes to ServerError", () => {
    const error = createErrorFromResponse(500, {
      success: false,
      error: { code: "CREATE_NAMESPACE_FAILED", message: "Failed", requestId: "req-7" },
    });
    expect(error).toBeInstanceOf(ServerError);
    expect(error.code).toBe("CREATE_NAMESPACE_FAILED");
  });

  it("should map 404 resource codes to NotFoundError", () => {
    const error = createErrorFromResponse(404, {
      success: false,
      error: { code: "PLAN_NOT_FOUND", message: "Not found", requestId: "req-8" },
    });
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.code).toBe("PLAN_NOT_FOUND");
  });

  it("should handle backend typos like UNAUTORIZED_USER", () => {
    const error = createErrorFromResponse(401, {
      success: false,
      error: { code: "UNAUTORIZED_USER", message: "Typo", requestId: "req-9" },
    });
    expect(error).toBeInstanceOf(AuthenticationError);
  });

  it("should fallback to KyrazoError for unknown codes/status", () => {
    const error = createErrorFromResponse(418, {
      success: false,
      error: { code: "IM_A_TEAPOT", message: "Teapot", requestId: "req-10" },
    });
    expect(error).toBeInstanceOf(KyrazoError);
    expect(error.statusCode).toBe(418);
  });
});
