import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createSourcesModule,
  type SourcesModule,
} from "../../src/modules/sources/index";
import { HttpClient } from "../../src/utils/http";

describe("SourcesModule", () => {
  let sources: SourcesModule;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;
    sources = createSourcesModule(mockHttpClient);
  });

  it("should list sources", async () => {
    const mockResponse = { data: { data: [], pagination: {} } };
    mockHttpClient.get.mockResolvedValue(mockResponse);

    await sources.list("proj_123");

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      "/v1/sources/proj_123",
      undefined,
    );
  });

  it("should create a source", async () => {
    const mockData = {
      name: "Test Source",
      service: "stripe",
      type: "receive",
    };
    const mockResponse = { data: { data: { ...mockData, _id: "src_123" } } };
    mockHttpClient.post.mockResolvedValue(mockResponse);

    await sources.create("proj_123", mockData as any);

    expect(mockHttpClient.post).toHaveBeenCalledWith(
      "/v1/sources/proj_123",
      mockData,
    );
  });
});
