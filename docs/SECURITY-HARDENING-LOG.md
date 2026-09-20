# Security Hardening Log — RC17

## Findings addressed

### HUI-NATIVE-001 — Native authorization depended on renderer enforcement
**Severity:** Critical design weakness

RC16 explicitly stated that the native command trusted frontend authorization. RC17 introduces signed, short-lived capability tokens and native-side verification.

### HUI-NATIVE-002 — Native replay protection was absent
**Severity:** High

RC17 adds a bounded nonce replay cache and native request rate limiting.

### HUI-NATIVE-003 — Native operation/risk binding was incomplete
**Severity:** High

RC17 maps each native operation to an expected risk and rejects mismatches.

### HUI-NATIVE-004 — Path traversal validation relied primarily on canonicalization
**Severity:** High

RC17 rejects root, parent-directory and platform-prefix path components before filesystem operations. Symlink race resistance still requires OS-specific no-follow/openat-style hardening and remains a release blocker.

## Remaining blockers

- OS sandboxing and privilege separation
- deterministic npm and Cargo lockfiles
- native fuzzing
- symlink-race resistant filesystem primitives
- cross-platform native qualification
- independent penetration testing
- release signing/provenance and SBOM generated from the exact release build
