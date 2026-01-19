/**
 * Targets Module
 */

import { HttpClient } from "../../utils/http";
import type {
  Target,
  CreateTargetInput,
  UpdateTargetInput,
  FilterTargetsInput,
} from "../../types/targets";
import type { PaginatedResponse, APIResponse } from "../../types/common";

/**
 * Targets Module Interface
 */
export interface TargetsModule {
  list: (
    projectId: string,
    params?: FilterTargetsInput,
  ) => Promise<PaginatedResponse<Target>>;
  get: (projectId: string, targetId: string) => Promise<APIResponse<Target>>;
  create: (
    projectId: string,
    data: CreateTargetInput,
  ) => Promise<APIResponse<Target>>;
  update: (
    projectId: string,
    targetId: string,
    data: UpdateTargetInput,
  ) => Promise<APIResponse<Target>>;
  delete: (projectId: string, targetId: string) => Promise<APIResponse<void>>;
}

/**
 * Create Targets Module
 * @internal
 */
export function createTargetsModule(client: HttpClient): TargetsModule {
  return {
    async list(
      projectId: string,
      params?: FilterTargetsInput,
    ): Promise<PaginatedResponse<Target>> {
      const response = await client.get<PaginatedResponse<Target>>(
        `/v1/targets/${projectId}`,
        params,
      );
      return response.data;
    },

    async get(
      projectId: string,
      targetId: string,
    ): Promise<APIResponse<Target>> {
      const response = await client.get<APIResponse<Target>>(
        `/v1/targets/${projectId}/${targetId}`,
      );
      return response.data;
    },

    async create(
      projectId: string,
      data: CreateTargetInput,
    ): Promise<APIResponse<Target>> {
      const response = await client.post<APIResponse<Target>>(
        `/v1/targets/${projectId}`,
        data,
      );
      return response.data;
    },

    async update(
      projectId: string,
      targetId: string,
      data: UpdateTargetInput,
    ): Promise<APIResponse<Target>> {
      const response = await client.patch<APIResponse<Target>>(
        `/v1/targets/${projectId}/${targetId}`,
        data,
      );
      return response.data;
    },

    async delete(
      projectId: string,
      targetId: string,
    ): Promise<APIResponse<void>> {
      const response = await client.delete<APIResponse<void>>(
        `/v1/targets/${projectId}/${targetId}`,
      );
      return response.data;
    },
  };
}
