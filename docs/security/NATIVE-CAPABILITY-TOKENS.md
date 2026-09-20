# Native Capability Tokens

The native host is a final authorization boundary. Renderer-side capability checks are advisory and must never be treated as sufficient authorization.

## Token

A capability token contains signed claims:

- version
- capability_id
- session_id
- operation
- risk
- issued_at
- expires_at
- nonce

The native process verifies the Ed25519 signature using a release-configured issuer public key and binds every claim to the incoming request.

## Security requirements

- issuer private keys never ship in the application
- production public keys are injected at release build time
- release builds fail when the issuer public key is not configured
- tokens are short-lived
- the token nonce must equal the request nonce
- native replay protection is independent of renderer replay protection
- operation and risk are checked independently at the native boundary
- key rotation requires a signed release and explicit trust-store migration

This mechanism protects the native authorization boundary against a compromised renderer. It does not by itself establish OS-level sandboxing or privilege separation; those remain separate release gates.
