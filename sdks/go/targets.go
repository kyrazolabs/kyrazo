package kyrazo

import (
	"context"
	"fmt"

	"github.com/kyrazolabs/sdks/go/internal/request"
	"github.com/kyrazolabs/sdks/go/models"
)

// TargetsModule provides methods to manage webhook targets
type TargetsModule struct {
	client *request.Client
}

func newTargetsModule(cl *request.Client) *TargetsModule {
	return &TargetsModule{client: cl}
}

// List retrieves a paginated list of targets for the specified namespace.
func (m *TargetsModule) List(ctx context.Context, namespaceId string, q string, limit, page int) (*models.ApiResponse[[]models.Target], error) {
	var resp models.ApiResponse[[]models.Target]
	query := map[string]string{}
	if q != "" {
		query["q"] = q
	}
	if limit > 0 {
		query["limit"] = fmt.Sprintf("%d", limit)
	}
	if page > 0 {
		query["page"] = fmt.Sprintf("%d", page)
	}

	err := m.client.Do(ctx, request.RequestConfig{
		Method: "GET",
		Path:   fmt.Sprintf("/v1/targets/%s", namespaceId),
		Query:  query,
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Get retrieves details of a specific target.
func (m *TargetsModule) Get(ctx context.Context, namespaceId, targetId string) (*models.ApiResponse[models.Target], error) {
	var resp models.ApiResponse[models.Target]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "GET",
		Path:   fmt.Sprintf("/v1/targets/%s/%s", namespaceId, targetId),
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Create creates a new webhook target for the specified namespace.
func (m *TargetsModule) Create(ctx context.Context, namespaceId string, input models.CreateTargetInput) (*models.ApiResponse[models.Target], error) {
	var resp models.ApiResponse[models.Target]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "POST",
		Path:   fmt.Sprintf("/v1/targets/%s", namespaceId),
		Body:   input,
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Update updates properties of a specific target.
func (m *TargetsModule) Update(ctx context.Context, namespaceId, targetId string, input models.UpdateTargetInput) (*models.ApiResponse[models.Target], error) {
	var resp models.ApiResponse[models.Target]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "PATCH",
		Path:   fmt.Sprintf("/v1/targets/%s/%s", namespaceId, targetId),
		Body:   input,
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Delete permanently deletes a specific target.
func (m *TargetsModule) Delete(ctx context.Context, namespaceId, targetId string) (*models.ApiResponse[bool], error) {
	var resp models.ApiResponse[bool]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "DELETE",
		Path:   fmt.Sprintf("/v1/targets/%s/%s", namespaceId, targetId),
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// GetSecret retrieves the signing secret for the target.
func (m *TargetsModule) GetSecret(ctx context.Context, namespaceId, targetId string) (*models.ApiResponse[string], error) {
	var resp models.ApiResponse[string]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "GET",
		Path:   fmt.Sprintf("/v1/targets/%s/%s/secret", namespaceId, targetId),
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}
