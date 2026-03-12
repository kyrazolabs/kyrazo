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
   * List targets for a namespace.
   * @param namespaceId - The namespace ID.
   * @param params - Optional filter and pagination parameters.
   */
  list: (
    namespaceId: string,
    params?: FilterTargetsInput,
  ) => Promise<PaginatedResponse<Target>>;

  /**
   * Get a single target by its ID.
   * @param namespaceId - The namespace ID.
   * @param targetId - The target ID.
   */
  get: (namespaceId: string, targetId: string) => Promise<APIResponse<Target>>;

  /**
   * Create a new delivery target.
   * @param namespaceId - The namespace ID.
   * @param data - Target configuration.
   */
  create: (
    namespaceId: string,
    data: CreateTargetInput,
  ) => Promise<APIResponse<Target>>;

  /**
   * Update an existing delivery target.
   * @param namespaceId - The namespace ID.
   * @param targetId - The target ID.
   * @param data - Updated target configuration.
   */
  update: (
    namespaceId: string,
    targetId: string,
    data: UpdateTargetInput,
  ) => Promise<APIResponse<Target>>;

  /**
   * Delete a delivery target.
   * @param namespaceId - The namespace ID.
   * @param targetId - The target ID.
   */
  delete: (namespaceId: string, targetId: string) => Promise<APIResponse<void>>;

  /**
   * Get the signing secret for a target.
   * @param namespaceId - The namespace ID.
   * @param targetId - The target ID.
   */
  getSecret: (
    namespaceId: string,
    targetId: string,
  ) => Promise<APIResponse<{ secret: string }>>;

  /**
   * Enable or disable a target.
   * @param namespaceId - The namespace ID.
   * @param targetId - The target ID.
   * @param enabled - Whether the target should be enabled.
   */
  updateStatus: (
    namespaceId: string,
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
      namespaceId: string,
      params?: FilterTargetsInput,
    ): Promise<PaginatedResponse<Target>> {
      const response = await client.get<PaginatedResponse<Target>>(
        `/v1/targets/${namespaceId}`,
        params,
      );
      // Backend: { success, message, pagination, data: Target[] }
      return response.data;
    },

    async get(
      namespaceId: string,
      targetId: string,
    ): Promise<APIResponse<Target>> {
      const response = await client.get<APIResponse<Target>>(
        `/v1/targets/${namespaceId}/${targetId}`,
      );
      // Backend: { success, message, data: Target }
      return response.data;
    },

    async create(
      namespaceId: string,
      data: CreateTargetInput,
    ): Promise<APIResponse<Target>> {
      const response = await client.post<APIResponse<Target>>(
        `/v1/targets/${namespaceId}`,
        data,
      );
      // Backend: { success, message, data: Target }
      return response.data;
    },

    async update(
      namespaceId: string,
      targetId: string,
      data: UpdateTargetInput,
    ): Promise<APIResponse<Target>> {
      const response = await client.patch<APIResponse<Target>>(
        `/v1/targets/${namespaceId}/${targetId}`,
        data,
      );
      // Backend: { success, message, data: Target }
      return response.data;
    },

    async delete(
      namespaceId: string,
      targetId: string,
    ): Promise<APIResponse<void>> {
      const response = await client.delete<APIResponse<void>>(
        `/v1/targets/${namespaceId}/${targetId}`,
      );
      return response.data;
    },

    async getSecret(
      namespaceId: string,
      targetId: string,
    ): Promise<APIResponse<{ secret: string }>> {
      const response = await client.get<APIResponse<{ secret: string }>>(
        `/v1/targets/${namespaceId}/${targetId}/secret`,
      );
      return response.data;
    },

    async updateStatus(
      namespaceId: string,
      targetId: string,
      enabled: boolean,
    ): Promise<APIResponse<Target>> {
      const response = await client.put<APIResponse<Target>>(
        `/v1/targets/${namespaceId}/${targetId}`,
        { targetId, enabled },
      );
      return response.data;
    },
  };
}
