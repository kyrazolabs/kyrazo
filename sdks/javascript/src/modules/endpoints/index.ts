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
   * List endpoints for a namespace.
   * @param namespaceId - The namespace ID.
   * @param params - Optional filter and pagination parameters.
   */
  list: (
    namespaceId: string,
    params?: FilterEndpointsInput,
  ) => Promise<PaginatedResponse<Endpoint>>;

  /**
   * Get a single endpoint by its ID.
   * @param namespaceId - The namespace ID.
   * @param endpointId - The endpoint ID.
   */
  get: (
    namespaceId: string,
    endpointId: string,
  ) => Promise<APIResponse<Endpoint>>;

  /**
   * Create a new webhook endpoint.
   * @param namespaceId - The namespace ID.
   * @param data - Endpoint configuration.
   */
  create: (
    namespaceId: string,
    data: CreateEndpointInput,
  ) => Promise<APIResponse<Endpoint>>;

  /**
   * Update an existing webhook endpoint.
   * @param namespaceId - The namespace ID.
   * @param endpointId - The endpoint ID.
   * @param data - Updated endpoint configuration.
   */
  update: (
    namespaceId: string,
    endpointId: string,
    data: UpdateEndpointInput,
  ) => Promise<APIResponse<Endpoint>>;

  /**
   * Delete a webhook endpoint.
   * @param namespaceId - The namespace ID.
   * @param endpointId - The endpoint ID.
   */
  delete: (
    namespaceId: string,
    endpointId: string,
  ) => Promise<APIResponse<void>>;

  /**
   * Get the signing secret for an endpoint.
   * @param namespaceId - The namespace ID.
   * @param endpointId - The endpoint ID.
   */
  getSecret: (
    namespaceId: string,
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
      namespaceId: string,
      params?: FilterEndpointsInput,
    ): Promise<PaginatedResponse<Endpoint>> {
      const response = await client.get<PaginatedResponse<Endpoint>>(
        `/v1/endpoints/${namespaceId}`,
        params,
      );
      // Backend: { success, pagination, data: Endpoint[] }
      return response.data;
    },

    async get(
      namespaceId: string,
      endpointId: string,
    ): Promise<APIResponse<Endpoint>> {
      const response = await client.get<APIResponse<Endpoint>>(
        `/v1/endpoints/${namespaceId}/${endpointId}`,
      );
      // Backend: { success, message, data: Endpoint }
      return response.data;
    },

    async create(
      namespaceId: string,
      data: CreateEndpointInput,
    ): Promise<APIResponse<Endpoint>> {
      const response = await client.post<APIResponse<{ endpoint: Endpoint }>>(
        `/v1/endpoints/${namespaceId}`,
        data,
      );
      // Backend: { success, message, data: { endpoint: Endpoint } }
      return {
        ...response.data,
        data: response.data.data.endpoint,
      };
    },

    async update(
      namespaceId: string,
      endpointId: string,
      data: UpdateEndpointInput,
    ): Promise<APIResponse<Endpoint>> {
      const response = await client.patch<APIResponse<Endpoint>>(
        `/v1/endpoints/${namespaceId}/${endpointId}`,
        data,
      );
      // Backend: { success, message, data: Endpoint }
      return response.data;
    },

    async delete(
      namespaceId: string,
      endpointId: string,
    ): Promise<APIResponse<void>> {
      const response = await client.delete<APIResponse<void>>(
        `/v1/endpoints/${namespaceId}/${endpointId}`,
      );
      return response.data;
    },

    async getSecret(
      namespaceId: string,
      endpointId: string,
    ): Promise<APIResponse<{ secret: string }>> {
      const response = await client.get<APIResponse<{ secret: string }>>(
        `/v1/endpoints/${namespaceId}/${endpointId}/secret`,
      );
      return response.data;
    },
  };
}
