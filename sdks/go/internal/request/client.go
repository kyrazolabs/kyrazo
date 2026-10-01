package request

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"time"

	"github.com/kyrazolabs/sdks/go/models/apierrors"
)

// Client is a robust HTTP client wrapper for the Kyrazo SDK
type Client struct {
	HTTPClient  *http.Client
	BaseURL     string
	APIKey      string
	UserAgent   string
	MaxRetries  int
	Timeout     time.Duration
}

// RequestConfig holds configuration for a single request
type RequestConfig struct {
	Method  string
	Path    string
	Body    interface{}
	Query   map[string]string
	Headers map[string]string
}

// NewClient creates a new robust HTTP client
func NewClient(baseURL, apiKey, userAgent string, timeout time.Duration, maxRetries int) *Client {
	return &Client{
		HTTPClient: &http.Client{
			Timeout: timeout,
		},
		BaseURL:    baseURL,
		APIKey:     apiKey,
		UserAgent:  userAgent,
		MaxRetries: maxRetries,
		Timeout:    timeout,
	}
}

// Do executes an HTTP request with retries and error handling
func (c *Client) Do(ctx context.Context, config RequestConfig, out interface{}) error {
	url := fmt.Sprintf("%s%s", c.BaseURL, config.Path)
	
	var lastErr error
	for attempt := 0; attempt <= c.MaxRetries; attempt++ {
		// Handle exponential backoff
		if attempt > 0 {
			backoff := time.Duration(math.Pow(2, float64(attempt-1))) * 100 * time.Millisecond
			select {
			case <-time.After(backoff):
			case <-ctx.Done():
				return ctx.Err()
			}
		}

		err := c.doAttempt(ctx, config, url, out)
		if err == nil {
			return nil
		}

		// Don't retry on certain errors
		if !c.shouldRetry(err) {
			return err
		}
		lastErr = err
	}

	return fmt.Errorf("request failed after %d retries: %w", c.MaxRetries, lastErr)
}

func (c *Client) doAttempt(ctx context.Context, config RequestConfig, url string, out interface{}) error {
	var bodyReader io.Reader
	if config.Body != nil {
		jsonBody, err := json.Marshal(config.Body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequestWithContext(ctx, config.Method, url, bodyReader)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Set Headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	req.Header.Set("x-api-key", c.APIKey)
	req.Header.Set("User-Agent", c.UserAgent)

	// Idempotency Key for mutation requests
	if config.Method == "POST" || config.Method == "PUT" || config.Method == "PATCH" {
		if config.Headers == nil || config.Headers["Idempotency-Key"] == "" {
			req.Header.Set("Idempotency-Key", fmt.Sprintf("itreq_%d", time.Now().UnixNano()))
		}
	}

	for k, v := range config.Headers {
		req.Header.Set(k, v)
	}

	// Query Params
	q := req.URL.Query()
	for k, v := range config.Query {
		q.Add(k, v)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("network error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		if out != nil {
			if err := json.NewDecoder(resp.Body).Decode(out); err != nil {
				return fmt.Errorf("failed to decode response: %w", err)
			}
		}
		return nil
	}

	return c.handleErrorResponse(resp)
}

func (c *Client) shouldRetry(err error) bool {
	// Retry on 5xx or specific 429
	if apiErr, ok := err.(*apierrors.KyrazoError); ok {
		return apiErr.StatusCode >= 500 || apiErr.StatusCode == 429
	}
	if _, ok := err.(*apierrors.ServerError); ok {
		return true
	}
	if _, ok := err.(*apierrors.RateLimitError); ok {
		return true
	}
	return false
}

func (c *Client) handleErrorResponse(resp *http.Response) error {
	body, _ := io.ReadAll(resp.Body)
	rid := resp.Header.Get("X-Request-Id")

	var apiErr struct {
		Error struct {
			Code              string      `json:"code"`
			Message           string      `json:"message"`
			Details           interface{} `json:"details"`
			RequestId         string      `json:"requestId"`
			RetryAfter        *int        `json:"retryAfter"`
			RemainingRequests *int        `json:"remainingRequests"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &apiErr); err != nil {
		// Fallback for non-JSON errors
		return &apierrors.KyrazoError{
			Message:    string(body),
			StatusCode: resp.StatusCode,
			RequestId:  rid,
		}
	}

	data := apiErr.Error
	if rid == "" {
		rid = data.RequestId
	}

	switch resp.StatusCode {
	case 401:
		return apierrors.NewAuthenticationError(data.Message, data.Code, rid)
	case 403:
		if data.Code == "LIMIT_EXCEEDED" {
			return apierrors.NewLimitExceededError(data.Message, rid, data.RetryAfter, data.RemainingRequests)
		}
		return apierrors.NewForbiddenError(data.Message, data.Code, rid)
	case 400:
		return apierrors.NewValidationError(data.Message, data.Code, rid, data.Details)
	case 409:
		return apierrors.NewConflictError(data.Message, data.Code, rid)
	case 429:
		return apierrors.NewRateLimitError(data.Message, rid, data.RetryAfter, data.RemainingRequests)
	case 500, 502, 503, 504:
		return apierrors.NewServerError(data.Message, data.Code, rid)
	}

	return &apierrors.KyrazoError{
		Message:    data.Message,
		Code:       data.Code,
		StatusCode: resp.StatusCode,
		RequestId:  rid,
	}
}
