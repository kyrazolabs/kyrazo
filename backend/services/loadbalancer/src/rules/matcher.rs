use hyper::Method;

use crate::config::RuleConfig;
use crate::rules::Rule;

/// Build sorted rules from config. Rules are sorted by priority DESC
/// so `match_rule` can iterate and return the first hit.
pub fn build_rules(configs: &[RuleConfig]) -> Vec<Rule> {
    let mut rules: Vec<Rule> = configs
        .iter()
        .map(|cfg| {
            // Convert "/api/*" → "/api/" for prefix matching
            let path_prefix = if cfg.match_path.ends_with('*') {
                cfg.match_path.trim_end_matches('*').to_string()
            } else {
                cfg.match_path.clone()
            };

            let methods: Vec<Method> = cfg
                .match_methods
                .iter()
                .filter_map(|m| m.parse().ok())
                .collect();

            Rule {
                id: cfg.id.clone(),
                path_prefix,
                methods,
                backend_ids: cfg.backends.clone(),
                priority: cfg.priority,
                strip_prefix: cfg.strip_prefix,
            }
        })
        .collect();

    // Sort by priority DESC — highest priority first
    rules.sort_by(|a, b| b.priority.cmp(&a.priority));
    rules
}

/// Match a request against the sorted rules. Returns the FIRST matching rule.
/// Uses prefix matching only (starts_with) — no regex for hot-path performance.
#[inline]
pub fn match_rule<'a>(rules: &'a [Rule], path: &str, method: &Method) -> Option<&'a Rule> {
    for rule in rules {
        // Check path prefix
        if !path.starts_with(&rule.path_prefix) {
            continue;
        }
        // Check method (empty methods list = match all)
        if !rule.methods.is_empty() && !rule.methods.contains(method) {
            continue;
        }
        return Some(rule);
    }
    None
}
