package kyrazo

import (
	"context"
	"fmt"

	"github.com/kyrazolabs/sdks/go/internal/request"
	"github.com/kyrazolabs/sdks/go/models"
)

// EndpointsModule provides methods to manage callback endpoints
type EndpointsModule struct {
	client *request.Client
}

func newEndpointsModule(cl *request.Client) *EndpointsModule {
	return &EndpointsModule{client: cl}
}

// List retrieves a paginated list of endpoints for the specified namespace.
func (m *EndpointsModule) List(ctx context.Context, namespaceId string, limit, page int) (*models.ApiResponse[[]models.Endpoint], error) {
	var resp models.ApiResponse[[]models.Endpoint]
	query := map[string]string{}
	if limit > 0 {
		query["limit"] = fmt.Sprintf("%d", limit)
	}
	if page > 0 {
		query["page"] = fmt.Sprintf("%d", page)
	}

	err := m.client.Do(ctx, request.RequestConfig{
		Method: "GET",
		Path:   fmt.Sprintf("/v1/endpoints/%s", namespaceId),
		Query:  query,
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Get retrieves details of a specific endpoint.
func (m *EndpointsModule) Get(ctx context.Context, namespaceId, endpointId string) (*models.ApiResponse[models.Endpoint], error) {
	var resp models.ApiResponse[models.Endpoint]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "GET",
		Path:   fmt.Sprintf("/v1/endpoints/%s/%s", namespaceId, endpointId),
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Create creates a new callback endpoint for the specified namespace.
func (m *EndpointsModule) Create(ctx context.Context, namespaceId string, input models.CreateEndpointInput) (*models.ApiResponse[models.Endpoint], error) {
	var resp models.ApiResponse[models.Endpoint]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "POST",
		Path:   fmt.Sprintf("/v1/endpoints/%s", namespaceId),
		Body:   input,
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Update updates properties of a specific endpoint.
func (m *EndpointsModule) Update(ctx context.Context, namespaceId, endpointId string, input models.UpdateEndpointInput) (*models.ApiResponse[models.Endpoint], error) {
	var resp models.ApiResponse[models.Endpoint]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "PATCH",
		Path:   fmt.Sprintf("/v1/endpoints/%s/%s", namespaceId, endpointId),
		Body:   input,
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Delete permanently deletes a specific endpoint.
func (m *EndpointsModule) Delete(ctx context.Context, namespaceId, endpointId string) (*models.ApiResponse[bool], error) {
	var resp models.ApiResponse[bool]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "DELETE",
		Path:   fmt.Sprintf("/v1/endpoints/%s/%s", namespaceId, endpointId),
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}
