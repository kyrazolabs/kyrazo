pub mod checker;

use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;

use crate::config::BackendConfig;

// ─── Backend ────────────────────────────────────────────────────────

/// A single backend server with atomic health state.
#[allow(dead_code)]
pub struct Backend {
    pub id: String,
    pub address: String,
    pub weight: u32,
    pub max_connections: usize,
    pub state: BackendState,
}

impl Backend {
    pub fn from_config(cfg: &BackendConfig) -> Arc<Self> {
        Arc::new(Self {
            id: cfg.id.clone(),
            address: cfg.address.clone(),
            weight: cfg.weight,
            max_connections: cfg.max_connections,
            state: BackendState::new(),
        })
    }

    #[inline]
    pub fn is_healthy(&self) -> bool {
        self.state.healthy.load(Ordering::Relaxed)
    }
}

// ─── BackendState ───────────────────────────────────────────────────

/// Atomic health counters — safe to read/write from any thread without locks.
pub struct BackendState {
    pub healthy: AtomicBool,
    pub consecutive_successes: AtomicU32,
    pub consecutive_failures: AtomicU32,
}

impl BackendState {
    pub fn new() -> Self {
        Self {
            // Start unhealthy — health checker will promote to healthy after verification
            healthy: AtomicBool::new(false),
            consecutive_successes: AtomicU32::new(0),
            consecutive_failures: AtomicU32::new(0),
        }
    }
}

impl Default for BackendState {
    fn default() -> Self {
        Self::new()
    }
}

// ─── BackendPool ────────────────────────────────────────────────────

/// Shared ownership of all backends.
pub struct BackendPool {
    pub backends: Vec<Arc<Backend>>,
}

impl BackendPool {
    pub fn new(backends: Vec<Arc<Backend>>) -> Self {
        Self { backends }
    }

    /// Get a backend by its ID.
    pub fn get(&self, id: &str) -> Option<Arc<Backend>> {
        self.backends.iter().find(|b| b.id == id).cloned()
    }

    /// Get a subset of backends by their IDs.
    pub fn subset(&self, ids: &[String]) -> Vec<Arc<Backend>> {
        ids.iter().filter_map(|id| self.get(id)).collect()
    }

    /// Check if all backends are unhealthy.
    pub fn all_unhealthy(&self) -> bool {
        self.backends.iter().all(|b| !b.is_healthy())
    }
}
