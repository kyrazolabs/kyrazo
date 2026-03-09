pub mod round_robin;

use std::sync::Arc;
use crate::health::Backend;

/// Strategy trait for selecting a backend from a set of candidates.
pub trait Strategy: Send + Sync {
    /// Select a healthy backend. Returns `None` if no healthy backend is available.
    fn select(&self, backends: &[Arc<Backend>]) -> Option<Arc<Backend>>;
}
