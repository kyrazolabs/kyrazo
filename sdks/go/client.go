package kyrazo

import (
	"time"

	"github.com/kyrazolabs/sdks/go/internal/request"
)

const (
	DefaultBaseURL   = "https://api.kyrazo.com"
	DefaultTimeout   = 30 * time.Second
	DefaultMaxRetries = 3
	SDKVersion       = "1.2.0"
)

// Client is the main Kyrazo SDK client
type Client struct {
	Events    *EventsModule
	Targets   *TargetsModule
	Endpoints *EndpointsModule
	Sources   *SourcesModule

	internal *request.Client
}

// New creates a new Kyrazo SDK client with the provided API key and options
func New(apiKey string, opts ...Option) *Client {
	config := &Config{
		BaseURL:    DefaultBaseURL,
		APIKey:     apiKey,
		Timeout:    DefaultTimeout,
		MaxRetries: DefaultMaxRetries,
		UserAgent:  "kyrazo-sdk-go/" + SDKVersion,
	}

	for _, opt := range opts {
		opt(config)
	}

	internal := request.NewClient(config.BaseURL, config.APIKey, config.UserAgent, config.Timeout, config.MaxRetries)

	return &Client{
		Events:    newEventsModule(internal),
		Targets:   newTargetsModule(internal),
		Endpoints: newEndpointsModule(internal),
		Sources:   newSourcesModule(internal),
		internal:  internal,
	}
}
