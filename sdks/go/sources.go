package kyrazo

import (
	"context"
	"fmt"

	"github.com/kyrazolabs/sdks/go/internal/request"
	"github.com/kyrazolabs/sdks/go/models"
)

// SourcesModule provides methods to manage event sources
type SourcesModule struct {
	client *request.Client
}

func newSourcesModule(cl *request.Client) *SourcesModule {
	return &SourcesModule{client: cl}
}

// List retrieves a paginated list of event sources.
func (m *SourcesModule) List(ctx context.Context, limit, page int) (*models.ApiResponse[[]models.Source], error) {
	var resp models.ApiResponse[[]models.Source]
	query := map[string]string{}
	if limit > 0 {
		query["limit"] = fmt.Sprintf("%d", limit)
	}
	if page > 0 {
		query["page"] = fmt.Sprintf("%d", page)
	}

	err := m.client.Do(ctx, request.RequestConfig{
		Method: "GET",
		Path:   "/v1/sources",
		Query:  query,
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Get retrieves details of a specific event source.
func (m *SourcesModule) Get(ctx context.Context, sourceId string) (*models.ApiResponse[models.Source], error) {
	var resp models.ApiResponse[models.Source]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "GET",
		Path:   fmt.Sprintf("/v1/sources/%s", sourceId),
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Create creates a new event source.
func (m *SourcesModule) Create(ctx context.Context, input models.CreateSourceInput) (*models.ApiResponse[models.Source], error) {
	var resp models.ApiResponse[models.Source]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "POST",
		Path:   "/v1/sources",
		Body:   input,
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Update updates properties of a specific event source.
func (m *SourcesModule) Update(ctx context.Context, sourceId string, input models.UpdateSourceInput) (*models.ApiResponse[models.Source], error) {
	var resp models.ApiResponse[models.Source]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "PATCH",
		Path:   fmt.Sprintf("/v1/sources/%s", sourceId),
		Body:   input,
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Delete permanently deletes a specific event source.
func (m *SourcesModule) Delete(ctx context.Context, sourceId string) (*models.ApiResponse[bool], error) {
	var resp models.ApiResponse[bool]
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "DELETE",
		Path:   fmt.Sprintf("/v1/sources/%s", sourceId),
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}
