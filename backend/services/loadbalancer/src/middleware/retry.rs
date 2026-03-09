use std::time::Duration;

/// Retry configuration for the request pipeline.
#[allow(dead_code)]
pub struct RetryPolicy {
    pub enabled: bool,
    pub max_attempts: u32,
    pub backoff_durations: Vec<Duration>,
}

#[allow(dead_code)]
impl RetryPolicy {
    pub fn from_config(cfg: &crate::config::RetryConfig) -> Self {
        let backoff_durations: Vec<Duration> = cfg
            .backoff_ms
            .iter()
            .map(|&ms| Duration::from_millis(ms))
            .collect();

        Self {
            enabled: cfg.enabled,
            max_attempts: cfg.max_attempts,
            backoff_durations,
        }
    }

    /// Get the backoff duration for a given attempt (0-indexed).
    /// Falls back to the last configured duration if attempt exceeds the list.
    #[inline]
    pub fn backoff_for(&self, attempt: u32) -> Duration {
        let idx = attempt as usize;
        if idx < self.backoff_durations.len() {
            self.backoff_durations[idx]
        } else {
            self.backoff_durations
                .last()
                .copied()
                .unwrap_or(Duration::from_millis(500))
        }
    }

    /// Whether a response status code is retryable (5xx server errors).
    #[inline]
    pub fn is_retryable_status(status: u16) -> bool {
        (500..600).contains(&status)
    }
}
