package kyrazo

import (
	"context"
	"fmt"

	"github.com/kyrazolabs/sdks/go/internal/request"
	"github.com/kyrazolabs/sdks/go/models"
)

// EventsModule provides methods to publish single or batch events
type EventsModule struct {
	client *request.Client
}

func newEventsModule(cl *request.Client) *EventsModule {
	return &EventsModule{client: cl}
}

// Single publishes a single event to the specified namespace and its associated targets.
func (m *EventsModule) Single(ctx context.Context, namespaceId string, payload models.PublishEvent) (*models.PublishEventResponse, error) {
	var resp models.PublishEventResponse
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "POST",
		Path:   fmt.Sprintf("/v1/events/%s/publish", namespaceId),
		Body:   payload,
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

// Batch publishes multiple events in a single batch request (max 100).
func (m *EventsModule) Batch(ctx context.Context, namespaceId string, payloads []models.PublishEvent) (*models.BatchPublishResponse, error) {
	var resp models.BatchPublishResponse
	err := m.client.Do(ctx, request.RequestConfig{
		Method: "POST",
		Path:   fmt.Sprintf("/v1/events/%s/publish/batch", namespaceId),
		Body:   payloads,
	}, &resp)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}
