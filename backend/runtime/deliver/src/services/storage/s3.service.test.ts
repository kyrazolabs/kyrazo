import { describe, it, expect, mock, beforeEach, spyOn } from "bun:test";
import { S3Service } from "./s3.service";

mock.module("@kyrazo/shared", () => ({
  logger: {
    debug: mock(() => {}),
    error: mock(() => {}),
  },
}));

describe("S3Service", () => {
  let s3Service: S3Service;
  const mockWrite = mock(() => Promise.resolve());
  const mockExists = mock(() => Promise.resolve(true));

  beforeEach(() => {
    s3Service = S3Service.getInstance();
    
    // Spy on the protected getClient method and return a mock client
    spyOn(s3Service as any, 'getClient').mockImplementation(() => ({
      write: mockWrite,
      exists: mockExists,
    }));
    
    mockWrite.mockClear();
    mockExists.mockClear();
  });

  it("should be a singleton", () => {
    const instance1 = S3Service.getInstance();
    const instance2 = S3Service.getInstance();
    expect(instance1).toBe(instance2);
  });

  it("should upload data successfully", async () => {
    const result = await s3Service.upload("test.json", '{"foo":"bar"}', {
      bucket: "test-bucket",
      region: "us-east-1",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });

    expect(result.success).toBe(true);
    expect(mockWrite).toHaveBeenCalledWith("test.json", '{"foo":"bar"}');
  });

  it("should return success: false when upload fails", async () => {
    mockWrite.mockImplementationOnce(() => Promise.reject(new Error("Upload failed")));

    const result = await s3Service.upload("test.json", "data", {
      bucket: "test-bucket",
      region: "us-east-1",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Upload failed");
  });

  it("should check if file exists", async () => {
    const exists = await s3Service.exists("test.json", {
      bucket: "test-bucket",
      region: "us-east-1",
      accessKeyId: "key",
      secretAccessKey: "secret",
    });

    expect(exists).toBe(true);
    expect(mockExists).toHaveBeenCalledWith("test.json");
  });
});
