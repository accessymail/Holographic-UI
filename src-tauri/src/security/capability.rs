use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use serde::{Deserialize, Serialize};

pub const MAX_CLOCK_SKEW_MS: i64 = 30_000;
pub const MAX_CAPABILITY_TTL_MS: i64 = 5 * 60_000;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CapabilityClaims {
    pub version: u8,
    pub capability_id: String,
    pub session_id: String,
    pub operation: String,
    pub risk: String,
    pub issued_at: i64,
    pub expires_at: i64,
    pub nonce: String,
}

#[derive(Debug, Deserialize)]
struct CapabilityToken {
    claims: CapabilityClaims,
    signature: String,
}

#[allow(clippy::too_many_arguments)]
pub fn verify_capability_token(
    token_json: &str,
    expected_capability_id: &str,
    expected_session_id: &str,
    expected_operation: &str,
    expected_risk: &str,
    expected_nonce: &str,
    now: i64,
    issuer_public_key_b64: &str,
) -> Result<CapabilityClaims, &'static str> {
    let token: CapabilityToken =
        serde_json::from_str(token_json).map_err(|_| "capability_token_invalid")?;
    let claims = &token.claims;
    if claims.version != 1 {
        return Err("capability_version_invalid");
    }
    if claims.capability_id != expected_capability_id || claims.session_id != expected_session_id {
        return Err("capability_binding_invalid");
    }
    if claims.operation != expected_operation {
        return Err("capability_operation_denied");
    }
    if claims.risk != expected_risk {
        return Err("capability_risk_mismatch");
    }
    if claims.expires_at <= now || claims.issued_at > now + MAX_CLOCK_SKEW_MS {
        return Err("capability_expired");
    }
    if claims.expires_at <= claims.issued_at
        || claims.expires_at - claims.issued_at > MAX_CAPABILITY_TTL_MS
    {
        return Err("capability_ttl_invalid");
    }
    if claims.nonce != expected_nonce {
        return Err("capability_nonce_mismatch");
    }

    let key_bytes = URL_SAFE_NO_PAD
        .decode(issuer_public_key_b64)
        .map_err(|_| "capability_issuer_key_invalid")?;
    let key_array: [u8; 32] = key_bytes
        .try_into()
        .map_err(|_| "capability_issuer_key_invalid")?;
    let key = VerifyingKey::from_bytes(&key_array).map_err(|_| "capability_issuer_key_invalid")?;
    let sig_bytes = URL_SAFE_NO_PAD
        .decode(&token.signature)
        .map_err(|_| "capability_signature_invalid")?;
    let sig = Signature::from_slice(&sig_bytes).map_err(|_| "capability_signature_invalid")?;
    let payload = serde_json::to_vec(claims).map_err(|_| "capability_payload_invalid")?;
    key.verify(&payload, &sig)
        .map_err(|_| "capability_signature_invalid")?;
    Ok(claims.clone())
}

#[cfg(test)]
mod tests {
    use super::*;
    use ed25519_dalek::{Signer, SigningKey};

    fn fixture() -> (String, SigningKey, CapabilityClaims) {
        let key = SigningKey::from_bytes(&[7u8; 32]);
        let claims = CapabilityClaims {
            version: 1,
            capability_id: "cap-test-1234".into(),
            session_id: "session-test-1234".into(),
            operation: "host.ping".into(),
            risk: "low".into(),
            issued_at: 1_000_000,
            expires_at: 1_010_000,
            nonce: "nonce-1234567890".into(),
        };
        let payload = serde_json::to_vec(&claims).unwrap();
        let sig = key.sign(&payload);
        let token = serde_json::json!({"claims": claims, "signature": URL_SAFE_NO_PAD.encode(sig.to_bytes())});
        (token.to_string(), key, claims)
    }

    #[test]
    fn accepts_valid_signed_token() {
        let (token, key, claims) = fixture();
        let public = URL_SAFE_NO_PAD.encode(key.verifying_key().to_bytes());
        let got = verify_capability_token(
            &token,
            &claims.capability_id,
            &claims.session_id,
            &claims.operation,
            &claims.risk,
            &claims.nonce,
            1_005_000,
            &public,
        )
        .unwrap();
        assert_eq!(got.nonce, claims.nonce);
    }

    #[test]
    fn rejects_tampered_claims() {
        let (mut token, key, claims) = fixture();
        token = token.replace("host.ping", "sandbox.write_text");
        let public = URL_SAFE_NO_PAD.encode(key.verifying_key().to_bytes());
        assert!(verify_capability_token(
            &token,
            &claims.capability_id,
            &claims.session_id,
            "sandbox.write_text",
            &claims.risk,
            &claims.nonce,
            1_005_000,
            &public
        )
        .is_err());
    }

    #[test]
    fn rejects_long_ttl() {
        let (_token, key, mut claims) = fixture();
        claims.expires_at = claims.issued_at + MAX_CAPABILITY_TTL_MS + 1;
        let payload = serde_json::to_vec(&claims).unwrap();
        let sig = key.sign(&payload);
        let token = serde_json::json!({"claims": claims, "signature": URL_SAFE_NO_PAD.encode(sig.to_bytes())});
        let public = URL_SAFE_NO_PAD.encode(key.verifying_key().to_bytes());
        assert_eq!(
            verify_capability_token(
                &token.to_string(),
                &claims.capability_id,
                &claims.session_id,
                &claims.operation,
                &claims.risk,
                &claims.nonce,
                1_005_000,
                &public
            )
            .unwrap_err(),
            "capability_ttl_invalid"
        );
    }
}
