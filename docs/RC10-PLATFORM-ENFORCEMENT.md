# RC10 — Platform Enforcement & Recovery

RC10 moves the native boundary from declarative qualification toward explicit enforcement claims while preserving a strict distinction between application policy and OS-level isolation.

## Controls

- Native requests expire after a bounded freshness window.
- Unix sandbox roots are created with `0700` permissions.
- Native responses carry an enforcement-versioned platform attestation.
- Browser/runtime validation fails closed when sandbox, process-deny, network-deny, filesystem-deny, or required privilege-separation controls are absent.
- Platform mismatch is rejected when a deployment declares an expected target.

## Important limitation

The attestation is a policy gate, not cryptographic proof of OS isolation. Windows ACLs, Linux sandboxing, macOS sandbox entitlements, privilege dropping, resource limits, and native IPC hardening require platform-specific builds and runtime tests.

## Qualification status

RC10 remains a release candidate. Full production certification requires dependency-backed TypeScript/Rust builds, Windows/Linux/macOS execution tests, OS sandbox verification, crash/recovery tests, fuzzing, and independent security review.
