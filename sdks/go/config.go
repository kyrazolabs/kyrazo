package kyrazo

import (
	"time"
)

type Config struct {
	BaseURL    string
	APIKey     string
	Timeout    time.Duration
	MaxRetries int
	UserAgent  string
}

type Option func(*Config)

func WithBaseURL(url string) Option {
	return func(c *Config) {
		c.BaseURL = url
	}
}

func WithTimeout(t time.Duration) Option {
	return func(c *Config) {
		c.Timeout = t
	}
}

func WithMaxRetries(r int) Option {
	return func(c *Config) {
		c.MaxRetries = r
	}
}

func WithUserAgent(ua string) Option {
	return func(c *Config) {
		c.UserAgent = ua
	}
}
