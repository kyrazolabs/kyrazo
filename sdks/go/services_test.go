package kyrazo_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/kyrazolabs/sdks/go"
	"github.com/kyrazolabs/sdks/go/models"
	"github.com/stretchr/testify/assert"
)

func TestEventsModule_Single(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/v1/events/ns_123/publish", r.URL.Path)
		assert.Equal(t, "POST", r.Method)
		assert.Equal(t, "test-api-key", r.Header.Get("x-api-key"))

		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(models.PublishEventResponse{
			EventId: "evt_123",
			Status:  "queued",
		})
	}))
	defer server.Close()

	client := kyrazo.New("test-api-key", kyrazo.WithBaseURL(server.URL))
	
	resp, err := client.Events.Single(context.Background(), "ns_123", models.PublishEvent{
		EventType: "user.created",
		Payload:   map[string]interface{}{"id": "u_1"},
	})

	assert.NoError(t, err)
	assert.Equal(t, "evt_123", resp.EventId)
	assert.Equal(t, "queued", resp.Status)
}

func TestTargetsModule_List(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/v1/targets/ns_123", r.URL.Path)
		assert.Equal(t, "10", r.URL.Query().Get("limit"))

		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(models.ApiResponse[[]models.Target]{
			Success: true,
			Data: []models.Target{
				{Id: "tgt_1", Name: "Webhook 1"},
			},
		})
	}))
	defer server.Close()

	client := kyrazo.New("test-api-key", kyrazo.WithBaseURL(server.URL))
	
	resp, err := client.Targets.List(context.Background(), "ns_123", "", 10, 1)

	assert.NoError(t, err)
	assert.True(t, resp.Success)
	assert.Len(t, resp.Data, 1)
	assert.Equal(t, "tgt_1", resp.Data[0].Id)
}
