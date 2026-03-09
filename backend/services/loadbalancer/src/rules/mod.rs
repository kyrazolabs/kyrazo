pub mod matcher;

use hyper::Method;

/// A routing rule that maps request path + method to a backend subset.
/// Rules are sorted by priority DESC at startup — no runtime sorting.
pub struct Rule {
    pub id: String,
    /// The path prefix to match, e.g. "/api/" (derived from "/api/*").
    pub path_prefix: String,
    /// Allowed HTTP methods. Empty = match all methods.
    pub methods: Vec<Method>,
    /// Backend IDs this rule routes to.
    pub backend_ids: Vec<String>,
    /// Higher priority = evaluated first.
    pub priority: u32,
}
