use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

use crate::metrics;

/// Lock-free token-bucket rate limiter.
///
/// Uses atomics only — no Mutex, no RwLock, no allocation per check.
/// Tokens are refilled lazily on each check instead of via a background task.
pub struct RateLimiter {
    /// Maximum tokens (burst capacity).
    capacity: u64,
    /// Tokens added per second.
    rate: u64,
    /// Available tokens × 1 (scaled as integer).
    tokens: AtomicU64,
    /// Last refill timestamp in nanoseconds since `epoch`.
    last_refill_nanos: AtomicU64,
    /// Reference point for nanosecond timestamps.
    epoch: Instant,
    /// Whether rate limiting is enabled.
    enabled: bool,
}

impl RateLimiter {
    pub fn new(rate: u64, capacity: u64, enabled: bool) -> Self {
        Self {
            capacity,
            rate,
            tokens: AtomicU64::new(capacity),
            last_refill_nanos: AtomicU64::new(0),
            epoch: Instant::now(),
            enabled,
        }
    }

    /// Try to acquire one token. Returns `true` if allowed, `false` if rate-limited.
    #[inline]
    pub fn try_acquire(&self) -> bool {
        if !self.enabled {
            return true;
        }

        self.refill();

        // Try to decrement tokens
        loop {
            let current = self.tokens.load(Ordering::Relaxed);
            if current == 0 {
                metrics::RATE_LIMITED_TOTAL.with_label_values(&[]).inc();
                return false;
            }
            match self.tokens.compare_exchange_weak(
                current,
                current - 1,
                Ordering::Relaxed,
                Ordering::Relaxed,
            ) {
                Ok(_) => return true,
                Err(_) => continue, // CAS failed, retry
            }
        }
    }

    /// Lazily refill tokens based on elapsed time.
    #[inline]
    fn refill(&self) {
        let now_nanos = self.epoch.elapsed().as_nanos() as u64;
        let last = self.last_refill_nanos.load(Ordering::Relaxed);
        let elapsed_nanos = now_nanos.saturating_sub(last);

        // Only refill if at least 1ms has passed to avoid spurious CAS loops
        if elapsed_nanos < 1_000_000 {
            return;
        }

        // Calculate new tokens: rate * elapsed_seconds
        let new_tokens = (self.rate as u128 * elapsed_nanos as u128 / 1_000_000_000) as u64;
        if new_tokens == 0 {
            return;
        }

        // Try to update the last refill timestamp
        if self
            .last_refill_nanos
            .compare_exchange(last, now_nanos, Ordering::Relaxed, Ordering::Relaxed)
            .is_ok()
        {
            // We won the CAS race — add tokens
            let current = self.tokens.load(Ordering::Relaxed);
            let new_total = (current + new_tokens).min(self.capacity);
            self.tokens.store(new_total, Ordering::Relaxed);
        }
        // If CAS failed, another thread already refilled — no problem.
    }
}
