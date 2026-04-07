package apierrors

import (
	"fmt"
)

// ValidationErrorDetail represents an individual validation error
type ValidationErrorDetail struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// KyrazoError is the base error type for all SDK errors
type KyrazoError struct {
	Message    string `json:"message"`
	Code       string `json:"code"`
	StatusCode int    `json:"status_code,omitempty"`
	RequestId  string `json:"request_id,omitempty"`
}

func (e *KyrazoError) Error() string {
	if e.RequestId != "" {
		return fmt.Sprintf("%s (code: %s, request_id: %s)", e.Message, e.Code, e.RequestId)
	}
	return fmt.Sprintf("%s (code: %s)", e.Message, e.Code)
}

// AuthenticationError - invalid or missing API key (401)
type AuthenticationError struct {
	KyrazoError
}

func NewAuthenticationError(message string, code string, requestId string) *AuthenticationError {
	return &AuthenticationError{
		KyrazoError: KyrazoError{
			Message:    message,
			Code:       code,
			StatusCode: 401,
			RequestId:  requestId,
		},
	}
}

// ForbiddenError - insufficient permissions (403)
type ForbiddenError struct {
	KyrazoError
}

func NewForbiddenError(message string, code string, requestId string) *ForbiddenError {
	return &ForbiddenError{
		KyrazoError: KyrazoError{
			Message:    message,
			Code:       code,
			StatusCode: 403,
			RequestId:  requestId,
		},
	}
}

// ValidationError - invalid request payload (400)
type ValidationError struct {
	KyrazoError
	Details []ValidationErrorDetail `json:"details,omitempty"`
}

func NewValidationError(message string, code string, requestId string, details interface{}) *ValidationError {
	var typedDetails []ValidationErrorDetail
	if d, ok := details.([]interface{}); ok {
		for _, item := range d {
			if m, ok := item.(map[string]interface{}); ok {
				typedDetails = append(typedDetails, ValidationErrorDetail{
					Field:   fmt.Sprintf("%v", m["field"]),
					Message: fmt.Sprintf("%v", m["message"]),
				})
			}
		}
	}

	return &ValidationError{
		KyrazoError: KyrazoError{
			Message:    message,
			Code:       code,
			StatusCode: 400,
			RequestId:  requestId,
		},
		Details: typedDetails,
	}
}

// RateLimitError - too many requests (429)
type RateLimitError struct {
	KyrazoError
	RetryAfter        *int `json:"retry_after,omitempty"`
	RemainingRequests *int `json:"remaining_requests,omitempty"`
}

func NewRateLimitError(message string, requestId string, retryAfter *int, remaining *int) *RateLimitError {
	return &RateLimitError{
		KyrazoError: KyrazoError{
			Message:    message,
			Code:       "RATE_LIMIT_EXCEEDED",
			StatusCode: 429,
			RequestId:  requestId,
		},
		RetryAfter:        retryAfter,
		RemainingRequests: remaining,
	}
}

// LimitExceededError - monthly event limit exceeded (403)
type LimitExceededError struct {
	KyrazoError
	RetryAfter        *int `json:"retry_after,omitempty"`
	RemainingRequests *int `json:"remaining_requests,omitempty"`
}

func NewLimitExceededError(message string, requestId string, retryAfter *int, remaining *int) *LimitExceededError {
	return &LimitExceededError{
		KyrazoError: KyrazoError{
			Message:    message,
			Code:       "LIMIT_EXCEEDED",
			StatusCode: 403,
			RequestId:  requestId,
		},
		RetryAfter:        retryAfter,
		RemainingRequests: remaining,
	}
}

// ServerError - internal API error (500)
type ServerError struct {
	KyrazoError
}

func NewServerError(message string, code string, requestId string) *ServerError {
	return &ServerError{
		KyrazoError: KyrazoError{
			Message:    message,
			Code:       code,
			StatusCode: 500,
			RequestId:  requestId,
		},
	}
}

// ConflictError - resource state conflict (409)
type ConflictError struct {
	KyrazoError
}

func NewConflictError(message string, code string, requestId string) *ConflictError {
	return &ConflictError{
		KyrazoError: KyrazoError{
			Message:    message,
			Code:       code,
			StatusCode: 409,
			RequestId:  requestId,
		},
	}
}
