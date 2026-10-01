use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;

use crate::health::Backend;
use crate::strategy::Strategy;

/// Lock-free weighted round-robin.
///
/// Backends are pre-expanded by weight at construction time so that the hot path
/// is a single `fetch_add` + modulo — no multiplication, no branching on weight.
pub struct RoundRobinStrategy {
    /// Pre-expanded sequence: e.g. weights [1,2,1] → [b0, b1, b1, b2]
    sequence: Vec<Arc<Backend>>,
    /// Monotonically increasing counter — wraps naturally at usize::MAX.
    counter: AtomicUsize,
}

impl RoundRobinStrategy {
    /// Build a new strategy from backends. Each backend appears `weight` times in
    /// the internal sequence.
    pub fn new(backends: &[Arc<Backend>]) -> Self {
        let mut sequence = Vec::new();
        for backend in backends {
            for _ in 0..backend.weight {
                sequence.push(Arc::clone(backend));
            }
        }
        Self {
            sequence,
            counter: AtomicUsize::new(0),
        }
    }

    /// Select the next healthy backend. Scans at most `sequence.len()` positions
    /// before giving up (all unhealthy).
    #[inline]
    pub fn next_healthy(&self) -> Option<Arc<Backend>> {
        let len = self.sequence.len();
        if len == 0 {
            return None;
        }

        let start = self.counter.fetch_add(1, Ordering::Relaxed);
        for i in 0..len {
            let idx = (start + i) % len;
            let backend = &self.sequence[idx];
            if backend.is_healthy() {
                return Some(Arc::clone(backend));
            }
        }
        None
    }
}

impl Strategy for RoundRobinStrategy {
    #[inline]
    fn select(&self, _backends: &[Arc<Backend>]) -> Option<Arc<Backend>> {
        // The strategy uses its own pre-built sequence, not the passed slice.
        self.next_healthy()
    }
}
