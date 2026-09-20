use std::collections::{HashMap, HashSet};

const MAX_NONCE_CACHE: usize = 4096;
const MAX_REQUESTS_PER_MINUTE: usize = 120;
const RATE_WINDOW_MS: i64 = 60_000;

pub struct NativeSecurityState {
    seen_nonces: HashSet<String>,
    nonce_times: HashMap<String, i64>,
    request_times: Vec<i64>,
}

impl NativeSecurityState {
    pub fn new() -> Self {
        Self {
            seen_nonces: HashSet::with_capacity(MAX_NONCE_CACHE),
            nonce_times: HashMap::with_capacity(MAX_NONCE_CACHE),
            request_times: Vec::with_capacity(MAX_REQUESTS_PER_MINUTE),
        }
    }

    pub fn admit(&mut self, nonce: &str, now_ms: i64) -> Result<(), String> {
        if nonce.is_empty() {
            return Err("native_nonce_invalid".to_string());
        }

        let cutoff = now_ms.saturating_sub(RATE_WINDOW_MS);

        self.request_times.retain(|timestamp| *timestamp > cutoff);

        if self.request_times.len() >= MAX_REQUESTS_PER_MINUTE {
            return Err("native_rate_limited".to_string());
        }

        if self.seen_nonces.contains(nonce) {
            return Err("native_replay".to_string());
        }

        self.request_times.push(now_ms);

        if self.seen_nonces.len() >= MAX_NONCE_CACHE {
            self.evict_oldest_nonce();
        }

        self.seen_nonces.insert(nonce.to_string());
        self.nonce_times.insert(nonce.to_string(), now_ms);

        Ok(())
    }

    fn evict_oldest_nonce(&mut self) {
        if let Some((oldest_nonce, _)) = self
            .nonce_times
            .iter()
            .min_by_key(|(_, timestamp)| *timestamp)
        {
            let oldest_nonce = oldest_nonce.clone();
            self.seen_nonces.remove(&oldest_nonce);
            self.nonce_times.remove(&oldest_nonce);
        }
    }
}

impl Default for NativeSecurityState {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_fresh_nonce() {
        let mut state = NativeSecurityState::new();

        assert!(state.admit("nonce-1234567890", 1_000_000).is_ok());
    }

    #[test]
    fn rejects_replayed_nonce() {
        let mut state = NativeSecurityState::new();

        assert!(state.admit("nonce-1234567890", 1_000_000).is_ok());
        assert_eq!(
            state.admit("nonce-1234567890", 1_000_001),
            Err("native_replay".to_string())
        );
    }

    #[test]
    fn expires_rate_window_entries() {
        let mut state = NativeSecurityState::new();

        for i in 0..MAX_REQUESTS_PER_MINUTE {
            assert!(state.admit(&format!("nonce-{i:016}"), 1_000_000).is_ok());
        }

        assert_eq!(
            state.admit("nonce-final-123456", 1_000_001),
            Err("native_rate_limited".to_string())
        );

        assert!(state
            .admit("nonce-after-window", 1_000_000 + RATE_WINDOW_MS + 1)
            .is_ok());
    }

    #[test]
    fn bounded_nonce_cache_evicts_oldest() {
        let mut state = NativeSecurityState::new();

        for i in 0..MAX_NONCE_CACHE {
            let now_ms = (i as i64) * (RATE_WINDOW_MS + 1);
            assert!(state.admit(&format!("nonce-{i:016}"), now_ms).is_ok());
        }

        let newest_now = (MAX_NONCE_CACHE as i64) * (RATE_WINDOW_MS + 1);

        assert!(state.admit("nonce-newest-123456", newest_now).is_ok());

        assert!(state
            .admit("nonce-0000000000000000", newest_now + 1)
            .is_ok());
    }
}
