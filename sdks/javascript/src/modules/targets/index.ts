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
 * Targets Module
 *
 * Provides methods for managing webhook delivery targets.
 */
export interface TargetsModule {
  /**
   * List targets for a project.
   * @param projectId - The project ID.
   * @param params - Optional filter and pagination parameters.
   */
  list: (
    projectId: string,
    params?: FilterTargetsInput,
  ) => Promise<PaginatedResponse<Target>>;

  /**
   * Get a single target by its ID.
   * @param projectId - The project ID.
   * @param targetId - The target ID.
   */
  get: (projectId: string, targetId: string) => Promise<APIResponse<Target>>;

  /**
   * Create a new delivery target.
   * @param projectId - The project ID.
   * @param data - Target configuration.
   */
  create: (
    projectId: string,
    data: CreateTargetInput,
  ) => Promise<APIResponse<Target>>;

  /**
   * Update an existing delivery target.
   * @param projectId - The project ID.
   * @param targetId - The target ID.
   * @param data - Updated target configuration.
   */
  update: (
    projectId: string,
    targetId: string,
    data: UpdateTargetInput,
  ) => Promise<APIResponse<Target>>;

  /**
   * Delete a delivery target.
   * @param projectId - The project ID.
   * @param targetId - The target ID.
   */
  delete: (projectId: string, targetId: string) => Promise<APIResponse<void>>;

  /**
   * Get the signing secret for a target.
   * @param projectId - The project ID.
   * @param targetId - The target ID.
   */
  getSecret: (
    projectId: string,
    targetId: string,
  ) => Promise<APIResponse<{ secret: string }>>;

  /**
   * Enable or disable a target.
   * @param projectId - The project ID.
   * @param targetId - The target ID.
   * @param enabled - Whether the target should be enabled.
   */
  updateStatus: (
    projectId: string,
    targetId: string,
    enabled: boolean,
  ) => Promise<APIResponse<Target>>;
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
      // Backend: { success, message, pagination, data: Target[] }
      return response.data;
    },

    async get(
      projectId: string,
      targetId: string,
    ): Promise<APIResponse<Target>> {
      const response = await client.get<APIResponse<Target>>(
        `/v1/targets/${projectId}/${targetId}`,
      );
      // Backend: { success, message, data: Target }
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
      // Backend: { success, message, data: Target }
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
      // Backend: { success, message, data: Target }
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

    async getSecret(
      projectId: string,
      targetId: string,
    ): Promise<APIResponse<{ secret: string }>> {
      const response = await client.get<APIResponse<{ secret: string }>>(
        `/v1/targets/${projectId}/${targetId}/secret`,
      );
      return response.data;
    },

    async updateStatus(
      projectId: string,
      targetId: string,
      enabled: boolean,
    ): Promise<APIResponse<Target>> {
      const response = await client.put<APIResponse<Target>>(
        `/v1/targets/${projectId}/${targetId}`,
        { targetId, enabled },
      );
      return response.data;
    },
  };
}
