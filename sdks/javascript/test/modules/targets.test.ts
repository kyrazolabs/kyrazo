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
});
