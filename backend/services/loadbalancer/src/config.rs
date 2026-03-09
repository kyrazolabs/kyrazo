use anyhow::{Context, Result};
use arc_swap::ArcSwap;
use serde::Deserialize;
use std::path::Path;
use std::sync::Arc;

// ─── Configuration Structs ──────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub backends: Vec<BackendConfig>,
    pub health_check: HealthCheckConfig,
    #[serde(default)]
    pub rules: Vec<RuleConfig>,
    #[serde(default)]
    pub rate_limit: RateLimitConfig,
    #[serde(default)]
    pub retry: RetryConfig,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
pub struct ServerConfig {
    pub bind: String,
    pub metrics_bind: String,
    #[serde(default)]
    pub worker_threads: usize,
    #[serde(default = "default_max_connections")]
    pub max_connections: usize,
}

fn default_max_connections() -> usize {
    100_000
}

#[derive(Debug, Clone, Deserialize)]
pub struct BackendConfig {
    pub id: String,
    pub address: String,
    #[serde(default = "default_weight")]
    pub weight: u32,
    #[serde(default = "default_backend_max_conn")]
    pub max_connections: usize,
}

fn default_weight() -> u32 {
    1
}

fn default_backend_max_conn() -> usize {
    500
}

#[derive(Debug, Clone, Deserialize)]
pub struct HealthCheckConfig {
    #[serde(default = "default_interval")]
    pub interval_secs: u64,
    #[serde(default = "default_timeout")]
    pub timeout_secs: u64,
    #[serde(default = "default_health_path")]
    pub path: String,
    #[serde(default = "default_healthy_threshold")]
    pub healthy_threshold: u32,
    #[serde(default = "default_unhealthy_threshold")]
    pub unhealthy_threshold: u32,
}

fn default_interval() -> u64 {
    5
}
fn default_timeout() -> u64 {
    2
}
fn default_health_path() -> String {
    "/health".to_string()
}
fn default_healthy_threshold() -> u32 {
    2
}
fn default_unhealthy_threshold() -> u32 {
    3
}

#[derive(Debug, Clone, Deserialize)]
pub struct RuleConfig {
    pub id: String,
    pub match_path: String,
    #[serde(default)]
    pub match_methods: Vec<String>,
    pub backends: Vec<String>,
    #[serde(default)]
    pub priority: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct RateLimitConfig {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default = "default_rps")]
    pub requests_per_second: u64,
    #[serde(default = "default_burst")]
    pub burst: u64,
}

fn default_rps() -> u64 {
    1000
}
fn default_burst() -> u64 {
    2000
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            requests_per_second: default_rps(),
            burst: default_burst(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct RetryConfig {
    #[serde(default)]
    pub enabled: bool,
    #[serde(default = "default_max_attempts")]
    pub max_attempts: u32,
    #[serde(default = "default_backoff")]
    pub backoff_ms: Vec<u64>,
}

fn default_max_attempts() -> u32 {
    3
}
fn default_backoff() -> Vec<u64> {
    vec![50, 200, 500]
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            max_attempts: default_max_attempts(),
            backoff_ms: default_backoff(),
        }
    }
}

// ─── Config Loading ─────────────────────────────────────────────────

/// Load configuration from a TOML file at the given path.
pub fn load_config(path: &Path) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read config file: {}", path.display()))?;

    let config: Config =
        toml::from_str(&content).with_context(|| "failed to parse config TOML")?;

    validate_config(&config)?;
    Ok(config)
}

fn validate_config(config: &Config) -> Result<()> {
    anyhow::ensure!(!config.backends.is_empty(), "at least one backend is required");

    for backend in &config.backends {
        anyhow::ensure!(!backend.id.is_empty(), "backend id must not be empty");
        anyhow::ensure!(
            backend.address.starts_with("http://") || backend.address.starts_with("https://"),
            "backend '{}' address must start with http:// or https://",
            backend.id
        );
        anyhow::ensure!(backend.weight > 0, "backend '{}' weight must be > 0", backend.id);
    }

    // Validate rule references
    let backend_ids: std::collections::HashSet<&str> =
        config.backends.iter().map(|b| b.id.as_str()).collect();

    for rule in &config.rules {
        for bid in &rule.backends {
            anyhow::ensure!(
                backend_ids.contains(bid.as_str()),
                "rule '{}' references unknown backend '{}'",
                rule.id,
                bid
            );
        }
    }

    Ok(())
}

// ─── Hot-Reload ─────────────────────────────────────────────────────

/// Reload config from disk and swap it atomically into the `ArcSwap`.
/// Returns Ok(()) on success, logs and returns Err on failure (old config stays).
pub fn hot_reload(config_path: &Path, config_holder: &ArcSwap<Config>) -> Result<()> {
    let new_config = load_config(config_path)?;
    config_holder.store(Arc::new(new_config));
    Ok(())
}
