package request_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/kyrazolabs/sdks/go/internal/request"
	"github.com/kyrazolabs/sdks/go/models/apierrors"
	"github.com/stretchr/testify/assert"
)

func TestHttpClient_RetryLogic(t *testing.T) {
	attempts := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts < 3 {
			// Simulate transient 500 error
			w.WriteHeader(http.StatusInternalServerError)
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"error": map[string]string{
					"code":    "INTERNAL_ERROR",
					"message": "Temporary failure",
				},
			})
			return
		}
		// Success on 3rd attempt
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}))
	defer server.Close()

	client := request.NewClient(server.URL, "test-key", "test-ua", 10*time.Second, 3)
	
	var resp map[string]string
	err := client.Do(context.Background(), request.RequestConfig{
		Method: "GET",
		Path:   "/test",
	}, &resp)

	assert.NoError(t, err)
	assert.Equal(t, 3, attempts)
	assert.Equal(t, "ok", resp["status"])
}

func TestHttpClient_Idempotency(t *testing.T) {
	var capturedHeader string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedHeader = r.Header.Get("Idempotency-Key")
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client := request.NewClient(server.URL, "test-key", "test-ua", 10*time.Second, 1)

	// POST should have idempotency key
	err := client.Do(context.Background(), request.RequestConfig{
		Method: "POST",
		Path:   "/test",
		Body:   map[string]string{"foo": "bar"},
	}, nil)

	assert.NoError(t, err)
	assert.NotEmpty(t, capturedHeader)
	assert.Contains(t, capturedHeader, "itreq_")
}

func TestHttpClient_ErrorParsing(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error": map[string]string{
				"code":      "INVALID_API_KEY",
				"message":   "Invalid or missing API key",
				"requestId": "req_abc",
			},
		})
	}))
	defer server.Close()

	client := request.NewClient(server.URL, "wrong-key", "test-ua", 10*time.Second, 1)

	err := client.Do(context.Background(), request.RequestConfig{
		Method: "GET",
		Path:   "/test",
	}, nil)

	assert.Error(t, err)
	var authErr *apierrors.AuthenticationError
	assert.True(t, assert.ErrorAs(t, err, &authErr))
	assert.Equal(t, "INVALID_API_KEY", authErr.Code)
	assert.Equal(t, "req_abc", authErr.RequestId)
}
