/**
 * Endpoints Module
 */

import { HttpClient } from "../../utils/http";
import type {
  Endpoint,
  CreateEndpointInput,
  UpdateEndpointInput,
  FilterEndpointsInput,
} from "../../types/endpoints";
import type { PaginatedResponse, APIResponse } from "../../types/common";

/**
 * Endpoints Module
 *
 * Provides methods for managing webhook endpoints.
 */
export interface EndpointsModule {
  /**
   * List endpoints for a project.
   * @param projectId - The project ID.
   * @param params - Optional filter and pagination parameters.
   */
  list: (
    projectId: string,
    params?: FilterEndpointsInput,
  ) => Promise<PaginatedResponse<Endpoint>>;

  /**
   * Get a single endpoint by its ID.
   * @param projectId - The project ID.
   * @param endpointId - The endpoint ID.
   */
  get: (
    projectId: string,
    endpointId: string,
  ) => Promise<APIResponse<Endpoint>>;

  /**
   * Create a new webhook endpoint.
   * @param projectId - The project ID.
   * @param data - Endpoint configuration.
   */
  create: (
    projectId: string,
    data: CreateEndpointInput,
  ) => Promise<APIResponse<Endpoint>>;

  /**
   * Update an existing webhook endpoint.
   * @param projectId - The project ID.
   * @param endpointId - The endpoint ID.
   * @param data - Updated endpoint configuration.
   */
  update: (
    projectId: string,
    endpointId: string,
    data: UpdateEndpointInput,
  ) => Promise<APIResponse<Endpoint>>;

  /**
   * Delete a webhook endpoint.
   * @param projectId - The project ID.
   * @param endpointId - The endpoint ID.
   */
  delete: (projectId: string, endpointId: string) => Promise<APIResponse<void>>;

  /**
   * Get the signing secret for an endpoint.
   * @param projectId - The project ID.
   * @param endpointId - The endpoint ID.
   */
  getSecret: (
    projectId: string,
    endpointId: string,
  ) => Promise<APIResponse<{ secret: string }>>;
}

/**
 * Create Endpoints Module
 * @internal
 */
export function createEndpointsModule(client: HttpClient): EndpointsModule {
  return {
    async list(
      projectId: string,
      params?: FilterEndpointsInput,
    ): Promise<PaginatedResponse<Endpoint>> {
      const response = await client.get<PaginatedResponse<Endpoint>>(
        `/v1/endpoints/${projectId}`,
        params,
      );
      // Backend: { success, pagination, data: Endpoint[] }
      return response.data;
    },

    async get(
      projectId: string,
      endpointId: string,
    ): Promise<APIResponse<Endpoint>> {
      const response = await client.get<APIResponse<Endpoint>>(
        `/v1/endpoints/${projectId}/${endpointId}`,
      );
      // Backend: { success, message, data: Endpoint }
      return response.data;
    },

    async create(
      projectId: string,
      data: CreateEndpointInput,
    ): Promise<APIResponse<Endpoint>> {
      const response = await client.post<APIResponse<{ endpoint: Endpoint }>>(
        `/v1/endpoints/${projectId}`,
        data,
      );
      // Backend: { success, message, data: { endpoint: Endpoint } }
      return {
        ...response.data,
        data: response.data.data.endpoint,
      };
    },

    async update(
      projectId: string,
      endpointId: string,
      data: UpdateEndpointInput,
    ): Promise<APIResponse<Endpoint>> {
      const response = await client.patch<APIResponse<Endpoint>>(
        `/v1/endpoints/${projectId}/${endpointId}`,
        data,
      );
      // Backend: { success, message, data: Endpoint }
      return response.data;
    },

    async delete(
      projectId: string,
      endpointId: string,
    ): Promise<APIResponse<void>> {
      const response = await client.delete<APIResponse<void>>(
        `/v1/endpoints/${projectId}/${endpointId}`,
      );
      return response.data;
    },

    async getSecret(
      projectId: string,
      endpointId: string,
    ): Promise<APIResponse<{ secret: string }>> {
      const response = await client.get<APIResponse<{ secret: string }>>(
        `/v1/endpoints/${projectId}/${endpointId}/secret`,
      );
      return response.data;
    },
  };
}
