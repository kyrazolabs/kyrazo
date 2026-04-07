package apierrors_test

import (
	"errors"
	"testing"

	"github.com/kyrazolabs/sdks/go/models/apierrors"
	"github.com/stretchr/testify/assert"
)

func TestErrorHierarchy(t *testing.T) {
	t.Run("AuthenticationError", func(t *testing.T) {
		err := apierrors.NewAuthenticationError("Invalid key", "UNAUTHORIZED", "req_1")
		var authErr *apierrors.AuthenticationError
		assert.True(t, errors.As(err, &authErr))
		assert.Equal(t, 401, authErr.StatusCode)
		assert.Equal(t, "UNAUTHORIZED", authErr.Code)
		assert.Equal(t, "req_1", authErr.RequestId)
	})

	t.Run("RateLimitError", func(t *testing.T) {
		retryAfter := 30
		err := apierrors.NewRateLimitError("Slow down", "req_2", &retryAfter, nil)
		var rateErr *apierrors.RateLimitError
		assert.True(t, errors.As(err, &rateErr))
		assert.Equal(t, 429, rateErr.StatusCode)
		assert.Equal(t, 30, *rateErr.RetryAfter)
	})

	t.Run("ValidationError", func(t *testing.T) {
		details := []apierrors.ValidationErrorDetail{
			{Field: "field", Message: "required"},
		}
		err := apierrors.NewValidationError("Invalid payload", "VALIDATION_ERROR", "req_3", details)
		var valErr *apierrors.ValidationError
		assert.True(t, errors.As(err, &valErr))
		assert.Equal(t, 400, valErr.StatusCode)
		assert.Equal(t, details, valErr.Details)
	})

	t.Run("LimitExceededError", func(t *testing.T) {
		err := apierrors.NewLimitExceededError("Quota exceeded", "req_4", nil, nil)
		var limitErr *apierrors.LimitExceededError
		assert.True(t, errors.As(err, &limitErr))
		assert.Equal(t, 403, limitErr.StatusCode)
		assert.Equal(t, "LIMIT_EXCEEDED", limitErr.Code)
	})
}
