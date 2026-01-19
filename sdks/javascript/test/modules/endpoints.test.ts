import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createEndpointsModule,
  type EndpointsModule,
} from "../../src/modules/endpoints/index";
import { HttpClient } from "../../src/utils/http";

describe("EndpointsModule", () => {
  let endpoints: EndpointsModule;
  let mockHttpClient: any;

  beforeEach(() => {
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    } as unknown as HttpClient;
    endpoints = createEndpointsModule(mockHttpClient);
  });

  it("should list endpoints", async () => {
    const mockResponse = { data: { data: [], pagination: {} } };
    mockHttpClient.get.mockResolvedValue(mockResponse);

    await endpoints.list("proj_123");

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      "/v1/endpoints/proj_123",
      undefined,
    );
  });

  it("should get an endpoint", async () => {
    const mockResponse = { data: { data: { _id: "ep_123" } } };
    mockHttpClient.get.mockResolvedValue(mockResponse);

    await endpoints.get("proj_123", "ep_123");

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      "/v1/endpoints/proj_123/ep_123",
    );
  });

  it("should get endpoint secret", async () => {
    const mockResponse = { data: { secret: "whsec_123" } };
    mockHttpClient.get.mockResolvedValue(mockResponse);

    await endpoints.getSecret("proj_123", "ep_123");

    expect(mockHttpClient.get).toHaveBeenCalledWith(
      "/v1/endpoints/proj_123/ep_123/secret",
    );
  });
});
