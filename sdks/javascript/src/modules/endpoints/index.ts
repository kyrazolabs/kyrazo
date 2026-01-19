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
 * Endpoints Module Interface
 */
export interface EndpointsModule {
  list: (
    projectId: string,
    params?: FilterEndpointsInput,
  ) => Promise<PaginatedResponse<Endpoint>>;
  get: (
    projectId: string,
    endpointId: string,
  ) => Promise<APIResponse<Endpoint>>;
  create: (
    projectId: string,
    data: CreateEndpointInput,
  ) => Promise<APIResponse<Endpoint>>;
  update: (
    projectId: string,
    endpointId: string,
    data: UpdateEndpointInput,
  ) => Promise<APIResponse<Endpoint>>;
  delete: (projectId: string, endpointId: string) => Promise<APIResponse<void>>;
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
      return response.data;
    },

    async get(
      projectId: string,
      endpointId: string,
    ): Promise<APIResponse<Endpoint>> {
      const response = await client.get<APIResponse<Endpoint>>(
        `/v1/endpoints/${projectId}/${endpointId}`,
      );
      return response.data;
    },

    async create(
      projectId: string,
      data: CreateEndpointInput,
    ): Promise<APIResponse<Endpoint>> {
      const response = await client.post<APIResponse<Endpoint>>(
        `/v1/endpoints/${projectId}`,
        data,
      );
      return response.data;
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
  };
}
