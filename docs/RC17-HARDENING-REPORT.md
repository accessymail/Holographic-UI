# RC17 Hardening Report

## Baseline

Source baseline: Holographic UI RC16 Library artifact.
Target: RC17 hardening track.

## Implemented in this build

- Native host authorization moved from renderer-trust to signed capability-token verification.
- Ed25519 signature verification added to the native boundary.
- Capability token bound to session, capability ID, operation, risk and nonce.
- Native replay cache added.
- Native request rate limiting added.
- Native release builds require a configured capability-issuer public key.
- Native operation/risk mapping is enforced independently.
- Parent/root/prefix path components are rejected before filesystem access.
- Release gate and production-readiness documentation made explicit.
- Dependabot and CODEOWNERS baseline added.
- Security workflow requires deterministic dependency installation before security checks.

## Verification performed in this environment

- Static security scan: PASS.
- Release verification: PASS for the hardening baseline.
- npm tests: NOT RUNNABLE because dependencies are not installed and registry/cache access is unavailable in this environment.
- Rust build/check: NOT RUNNABLE because Cargo is not installed in this environment.
- package-lock.json: NOT generated because the required dependency metadata is not available offline.
- Cargo.lock: NOT generated because Cargo is unavailable.

## Remaining release blockers

1. Generate and commit package-lock.json and Cargo.lock from a trusted build environment.
2. Run complete TypeScript/Vitest suite.
3. Run cargo fmt/clippy/check/test with locked dependencies.
4. Implement OS-specific sandboxing and privilege separation.
5. Harden filesystem access against symlink/time-of-check-time-of-use races using platform-native primitives.
6. Add native IPC fuzzing and malformed-token/property tests.
7. Complete Windows/Linux/macOS qualification.
8. Generate SBOM from the exact release build.
9. Generate signed build provenance/attestation.
10. Perform independent penetration testing.
11. Resolve every release-blocking vulnerability.

## Certification position

This artifact is a **hardening build**, not an enterprise-security certification. The distinction is intentional and must remain explicit until independent evidence satisfies every release gate.
