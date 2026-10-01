package kyrazo_test

import (
	"testing"
	"time"

	"github.com/kyrazolabs/sdks/go"
	"github.com/stretchr/testify/assert"
)

func TestClientInitialization(t *testing.T) {
	apiKey := "test-api-key"
	client := kyrazo.New(apiKey,
		kyrazo.WithBaseURL("https://api.test.com"),
		kyrazo.WithTimeout(10*time.Second),
		kyrazo.WithMaxRetries(5),
	)

	assert.NotNil(t, client)
	assert.NotNil(t, client.Events)
	assert.NotNil(t, client.Targets)
	assert.NotNil(t, client.Endpoints)
	assert.NotNil(t, client.Sources)
}
