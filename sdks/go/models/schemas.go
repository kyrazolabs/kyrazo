package models

import (
	"time"
)

// Common Types

type Pagination struct {
	Total int `json:"total"`
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Pages int `json:"pages"`
}

type ApiResponse[T any] struct {
	Success    bool       `json:"success"`
	Message    string     `json:"message,omitempty"`
	Data       T          `json:"data,omitempty"`
	Pagination *Pagination `json:"pagination,omitempty"`
}

// Events

type EventTarget struct {
	TargetId  string `json:"targetId,omitempty"`
	TargetUrl string `json:"targetUrl,omitempty"`
}

type PublishEvent struct {
	EventType string                 `json:"eventType"`
	Payload   map[string]interface{} `json:"payload"`
	Targets   []EventTarget          `json:"targets,omitempty"`
	Priority  string                 `json:"priority,omitempty"`
}

type PublishEventResponse struct {
	Status           string   `json:"status"`
	EventId          string   `json:"eventId"`
	TargetsCount     int      `json:"targetsCount"`
	UnfoundTargets   []string `json:"unfoundTargets,omitempty"`
	QueuedAt         time.Time `json:"queuedAt"`
	ProcessingTimeMs int      `json:"processingTimeMs"`
}

type BatchPublishResponseItem struct {
	EventId      string `json:"eventId"`
	Status       string `json:"status"`
	TargetsCount int    `json:"targetsCount"`
}

type BatchPublishResponse struct {
	Status           string                     `json:"status"`
	BatchSize        int                        `json:"batchSize"`
	QueuedCount      int                        `json:"queuedCount"`
	SkippedCount     int                        `json:"skippedCount"`
	FailedCount      int                        `json:"failedCount"`
	Results          []BatchPublishResponseItem `json:"results"`
	QueuedAt         time.Time                  `json:"queuedAt"`
	ProcessingTimeMs int                        `json:"processingTimeMs"`
}

// Targets

type TargetConfig struct {
	Timeout           int `json:"timeout,omitempty"`
	RetryCount        int `json:"retryCount,omitempty"`
	RateLimit         int `json:"rateLimit,omitempty"`
	RateLimitDuration int `json:"rateLimitDuration,omitempty"`
}

type Target struct {
	Id            string            `json:"id"`
	Name          string            `json:"name"`
	Url           string            `json:"url"`
	Method        string            `json:"method"`
	Enabled       bool              `json:"enabled"`
	Config        TargetConfig      `json:"config"`
	CustomHeaders map[string]string `json:"customHeaders,omitempty"`
	CreatedAt     time.Time         `json:"createdAt"`
	UpdatedAt     time.Time         `json:"updatedAt"`
}

type CreateTargetInput struct {
	Name          string            `json:"name"`
	Url           string            `json:"url"`
	Method        string            `json:"method,omitempty"`
	Enabled       *bool             `json:"enabled,omitempty"`
	Config        *TargetConfig      `json:"config,omitempty"`
	CustomHeaders map[string]string `json:"customHeaders,omitempty"`
}

type UpdateTargetInput struct {
	Name          string            `json:"name,omitempty"`
	Url           string            `json:"url,omitempty"`
	Method        string            `json:"method,omitempty"`
	Enabled       *bool             `json:"enabled,omitempty"`
	Config        *TargetConfig      `json:"config,omitempty"`
	CustomHeaders map[string]string `json:"customHeaders,omitempty"`
}

// Endpoints

type Endpoint struct {
	Id            string            `json:"id"`
	Name          string            `json:"name"`
	Url           string            `json:"url"`
	Status        string            `json:"status"`
	Method        string            `json:"method"`
	Enabled       bool              `json:"enabled"`
	Config        TargetConfig      `json:"config"`
	CustomHeaders map[string]string `json:"customHeaders,omitempty"`
	CreatedAt     time.Time         `json:"createdAt"`
	UpdatedAt     time.Time         `json:"updatedAt"`
}

type CreateEndpointInput struct {
	Name          string            `json:"name"`
	Url           string            `json:"url"`
	Method        string            `json:"method,omitempty"`
	Enabled       *bool             `json:"enabled,omitempty"`
	Config        *TargetConfig      `json:"config,omitempty"`
	CustomHeaders map[string]string `json:"customHeaders,omitempty"`
}

type UpdateEndpointInput struct {
	Name          string            `json:"name,omitempty"`
	Url           string            `json:"url,omitempty"`
	Method        string            `json:"method,omitempty"`
	Status        string            `json:"status,omitempty"`
	Enabled       *bool             `json:"enabled,omitempty"`
	Config        *TargetConfig      `json:"config,omitempty"`
	CustomHeaders map[string]string `json:"customHeaders,omitempty"`
}

// Sources

type Source struct {
	Id            string            `json:"id"`
	Name          string            `json:"name"`
	Type          string            `json:"type"`
	Enabled       bool              `json:"enabled"`
	Config        map[string]interface{} `json:"config,omitempty"`
	CreatedAt     time.Time         `json:"createdAt"`
	UpdatedAt     time.Time         `json:"updatedAt"`
}

type CreateSourceInput struct {
	Name    string                 `json:"name"`
	Type    string                 `json:"type"`
	Enabled *bool                  `json:"enabled,omitempty"`
	Config  map[string]interface{} `json:"config,omitempty"`
}

type UpdateSourceInput struct {
	Name    string                 `json:"name,omitempty"`
	Type    string                 `json:"type,omitempty"`
	Enabled *bool                  `json:"enabled,omitempty"`
	Config  map[string]interface{} `json:"config,omitempty"`
}
