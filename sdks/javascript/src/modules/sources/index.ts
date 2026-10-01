/**
 * Sources Module
 */

import { HttpClient } from "../../utils/http";
import type {
  Source,
  CreateSourceInput,
  UpdateSourceInput,
  FilterSourcesInput,
} from "../../types/sources";
import type { PaginatedResponse, APIResponse } from "../../types/common";

/**
 * Sources Module Interface
 */
export interface SourcesModule {
  list: (
    namespaceId: string,
    params?: FilterSourcesInput,
  ) => Promise<PaginatedResponse<Source>>;
  get: (namespaceId: string, sourceId: string) => Promise<APIResponse<Source>>;
  create: (
    namespaceId: string,
    data: CreateSourceInput,
  ) => Promise<APIResponse<Source>>;
  update: (
    namespaceId: string,
    sourceId: string,
    data: UpdateSourceInput,
  ) => Promise<APIResponse<Source>>;
  delete: (namespaceId: string, sourceId: string) => Promise<APIResponse<void>>;
}

/**
 * Create Sources Module
 * @internal
 */
export function createSourcesModule(client: HttpClient): SourcesModule {
  return {
    async list(
      namespaceId: string,
      params?: FilterSourcesInput,
    ): Promise<PaginatedResponse<Source>> {
      const response = await client.get<PaginatedResponse<Source>>(
        `/v1/sources/${namespaceId}`,
        params,
      );
      return response.data;
    },

    async get(
      namespaceId: string,
      sourceId: string,
    ): Promise<APIResponse<Source>> {
      const response = await client.get<APIResponse<Source>>(
        `/v1/sources/${namespaceId}/${sourceId}`,
      );
      return response.data;
    },

    async create(
      namespaceId: string,
      data: CreateSourceInput,
    ): Promise<APIResponse<Source>> {
      const response = await client.post<APIResponse<Source>>(
        `/v1/sources/${namespaceId}`,
        data,
      );
      return response.data;
    },

    async update(
      namespaceId: string,
      sourceId: string,
      data: UpdateSourceInput,
    ): Promise<APIResponse<Source>> {
      const response = await client.patch<APIResponse<Source>>(
        `/v1/sources/${namespaceId}/${sourceId}`,
        data,
      );
      return response.data;
    },

    async delete(
      namespaceId: string,
      sourceId: string,
    ): Promise<APIResponse<void>> {
      const response = await client.delete<APIResponse<void>>(
        `/v1/sources/${namespaceId}/${sourceId}`,
      );
      return response.data;
    },
  };
}
