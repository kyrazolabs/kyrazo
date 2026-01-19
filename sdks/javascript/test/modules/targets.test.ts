import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTargetsModule,
  type TargetsModule,
} from "../../src/modules/targets/index";
import { HttpClient } from "../../src/utils/http";

describe("TargetsModule", () => {
  let targets: TargetsModule;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;
    targets = createTargetsModule(mockHttpClient);
  });

  it("should list targets", async () => {
    const mockResponse = { data: { data: [], pagination: {} } };
    mockHttpClient.get.mockResolvedValue(mockResponse);

    await targets.list("proj_123");

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      "/v1/targets/proj_123",
      undefined,
    );
  });

  it("should delete a target", async () => {
    const mockResponse = { data: { success: true } };
    mockHttpClient.delete.mockResolvedValue(mockResponse);

    await targets.delete("proj_123", "tgt_123");

    expect(mockHttpClient.delete).toHaveBeenCalledWith(
      "/v1/targets/proj_123/tgt_123",
    );
  });

  it("should get target secret", async () => {
    const mockResponse = { data: { secret: "whsec_123" } };
    mockHttpClient.get.mockResolvedValue(mockResponse);

    await targets.getSecret("proj_123", "tgt_123");

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      "/v1/targets/proj_123/tgt_123/secret",
    );
  });

  it("should update target status", async () => {
    const mockResponse = { data: { enabled: false } };
    mockHttpClient.put.mockResolvedValue(mockResponse);

    await targets.updateStatus("proj_123", "tgt_123", false);

    expect(mockHttpClient.put).toHaveBeenCalledWith(
      "/v1/targets/proj_123/tgt_123",
      { enabled: false },
    );
  });
});
