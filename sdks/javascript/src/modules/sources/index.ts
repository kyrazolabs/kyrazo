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
    projectId: string,
    params?: FilterSourcesInput,
  ) => Promise<PaginatedResponse<Source>>;
  get: (projectId: string, sourceId: string) => Promise<APIResponse<Source>>;
  create: (
    projectId: string,
    data: CreateSourceInput,
  ) => Promise<APIResponse<Source>>;
  update: (
    projectId: string,
    sourceId: string,
    data: UpdateSourceInput,
  ) => Promise<APIResponse<Source>>;
  delete: (projectId: string, sourceId: string) => Promise<APIResponse<void>>;
}

/**
 * Create Sources Module
 * @internal
 */
export function createSourcesModule(client: HttpClient): SourcesModule {
  return {
    async list(
      projectId: string,
      params?: FilterSourcesInput,
    ): Promise<PaginatedResponse<Source>> {
      const response = await client.get<PaginatedResponse<Source>>(
        `/v1/sources/${projectId}`,
        params,
      );
      return response.data;
    },

    async get(
      projectId: string,
      sourceId: string,
    ): Promise<APIResponse<Source>> {
      const response = await client.get<APIResponse<Source>>(
        `/v1/sources/${projectId}/${sourceId}`,
      );
      return response.data;
    },

    async create(
      projectId: string,
      data: CreateSourceInput,
    ): Promise<APIResponse<Source>> {
      const response = await client.post<APIResponse<Source>>(
        `/v1/sources/${projectId}`,
        data,
      );
      return response.data;
    },

    async update(
      projectId: string,
      sourceId: string,
      data: UpdateSourceInput,
    ): Promise<APIResponse<Source>> {
      const response = await client.patch<APIResponse<Source>>(
        `/v1/sources/${projectId}/${sourceId}`,
        data,
      );
      return response.data;
    },

    async delete(
      projectId: string,
      sourceId: string,
    ): Promise<APIResponse<void>> {
      const response = await client.delete<APIResponse<void>>(
        `/v1/sources/${projectId}/${sourceId}`,
      );
      return response.data;
    },
  };
}
