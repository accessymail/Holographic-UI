# Holographic UI v1.0.0-rc.16 Release Manifest

- Release type: Security hardening / production-readiness candidate
- License: MIT
- Protocol: hui/1.0
- Purpose: deterministic, testable, security-hardened path toward v1.0.0

## RC4 focus

- spatial interaction and gesture hardening
- explicit camera/session privacy controls
- secure runtime hardening
- safer local development binding
- WebSocket stale-socket/rate-limit protections
- VLM response/timeout controls
- stricter approval/capability validation
- capability propagation for AI/backend commands
- privacy-first remote screen redaction gate
- screen-analysis consent lifecycle
- analysis pixel-budget enforcement
- sensitive-result sanitization
- gesture smoothing, hysteresis and anti-chatter controls
- release verification script
- setup and pentest documentation
- CI/supply-chain hardening guidance
- deterministic-build and stable-release evidence report

## Promotion rule

Do not promote to v1.0.0 until the deterministic lockfile, networked CI build/test run, supported desktop builds, performance/accessibility/privacy verification, and independent security assessment gates are complete.


- strict AI action-proposal schema and allowlisted UI intent mapping
- authoritative session/capability binding and capability-derived risk
- AI proposal replay protection
- high/critical approval propagation without AI self-approval
- bounded VLM response streaming, schema validation, timeout/cancellation
- VLM session/correlation context propagation without treating headers as authorization


## RC6 focus

- final Secure Execution Gateway between authorized agent envelopes and host/tool executors
- execution-time capability and session revalidation
- immutable tool/executor risk matching
- replay protection and exact-argument approval binding
- execution TTL, timeout and cancellation
- bounded execution results
- explicit sandboxed-executor requirement
- clear separation between browser/runtime policy and OS-level enforcement

## RC7 focus

- fixed declarative native-host operation vocabulary
- Tauri native bridge with sandbox-only text operations
- filesystem path traversal and symlink-escape protections
- bounded native file/content sizes
- browser-side native-host schema/session/replay boundary
- explicit separation between capability authorization and native host enforcement
- no shell, process, unrestricted filesystem or arbitrary network executor exposed
- native host security qualification documented without claiming a complete OS sandbox

## RC11

Focus: production qualification, deterministic build gates, clean-environment verification, and explicit certification blockers.


## RC12 — Dependency & Build Reproducibility

Release-engineering gate added for npm/Cargo lockfiles, clean installs, build verification, manifest hashing, and SBOM/provenance evidence.


## RC15 — Release Integrity & SBOM

- Added SHA-256 release-integrity manifest and verification.
- Added declared-dependency CycloneDX-compatible SBOM evidence with explicit unresolved-dependency status.
- Build qualification version check is now dynamic rather than hardcoded.


## RC16 — Dependency Environment Qualification

- Captures npm/cache/network and Rust/Cargo availability before dependency-backed verification.
- Does not fabricate package-lock.json or Cargo.lock.
- Dependency-backed build remains blocked until a network-enabled environment with Rust/Cargo is available.
