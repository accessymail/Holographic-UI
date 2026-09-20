## 1.0.0-rc.17.5-os-isolation

- Added OS isolation contract and per-platform release evidence requirements.
- Added deployment sandbox documentation.
- Pinned CodeQL Action v4.38.0 to commit `b96794f015dfd88f77b49b1c93e0fa7110f94c63`.
- Explicitly retained `privilege_separated: false` until native platform evidence is produced.

## 1.0.0-rc.17.4 — Native IPC Authorization Extraction & Fuzz Boundary

- Extracted capability-token parsing and Ed25519 authorization into the production Rust security module.
- Added unit tests for valid signatures, claim tampering, and TTL enforcement.
- Connected the fuzz target directly to the production authorization module.
- Added attacker-controlled token fuzzing without GUI, filesystem, process, or network side effects.
- Added explicit fuzzing certification evidence requirements.
- Preserved fail-closed production certification; fuzzing remains uncertified until a real Rust campaign is executed.

## 1.0.0-rc.16 — Dependency Environment Qualification

- Added dependency-environment qualification evidence for npm/cache/toolchain availability.
- Added explicit network/registry and Cargo-toolchain blocker reporting.
- Preserved fail-closed build certification semantics; no synthetic lockfiles are generated.
- Synchronized package, Tauri, Cargo, VERSION, and RELEASE metadata to rc.16.

## 1.0.0-rc.15 — Release Integrity & SBOM Evidence

- Added deterministic release-integrity manifest with SHA-256 file hashes.
- Added CycloneDX-compatible declared-dependency SBOM evidence.
- Added release-integrity verification gate.
- Removed hardcoded RC versions from build/reproducibility/production qualification.
- Preserved explicit blocked status for unresolved dependency/toolchain verification.


- Added deterministic release-integrity manifest with SHA-256 file hashes.
- Added CycloneDX-compatible declared-dependency SBOM evidence.
- Added release-integrity verification gate.
- Removed hardcoded RC version from build-evidence qualification.
- Preserved explicit blocked status for unresolved dependency/toolchain verification.

## 1.0.0-rc.14

- Added dependency-backed build qualification harness.
- Added explicit npm ci, TypeScript, Vitest, Vite, and Cargo locked-build gates.
- Added machine-readable build qualification evidence.
- Preserved fail-closed behavior when dependency/toolchain prerequisites are unavailable.

## 1.0.0-rc.12

### Dependency & Build Reproducibility
- Added deterministic-build qualification gate.
- Added reproducibility manifest hashing and lockfile validation.
- Added explicit blocked-state reporting when package/Cargo registries or lockfiles are unavailable.
- Stable release remains gated on committed lockfiles and clean dependency-backed verification.

## 1.0.0-rc.10

### Platform Enforcement & Recovery
- Added native platform attestation validation.
- Added fail-closed platform enforcement checks for sandbox, process, network, filesystem, and privilege controls.
- Added bounded native request freshness validation.
- Hardened sandbox root permissions on Unix hosts.
- Added RC10 qualification tests and release gates.

# Changelog

## [1.0.0-rc.13]

### Added
- Cross-platform qualification harness for Linux, macOS, and Windows.
- Immutable-SHA CI workflow for dependency-backed typecheck, tests, and production builds.
- Cross-platform qualification report and fail-closed deterministic lockfile gate.

### Verification status
- Dependency-backed CI remains blocked locally until `package-lock.json` is committed and dependencies can be installed.


## 1.0.0-rc.7 — Native Host Boundary

- Added a fixed declarative native-host operation boundary for the Tauri shell.
- Added deny-by-default sandboxed text read/write operations rooted in an application-owned temporary sandbox directory.
- Added traversal, symlink escape, file-size, content-size, identity and sandbox-only checks at the native boundary.
- Added a browser-side NativeHostBoundary adapter with strict operation validation, session binding, replay protection and bounded payloads.
- Native host IPC does not issue or expand capabilities; authorization remains in the TypeScript execution gateway.
- Arbitrary shell, process, network and unrestricted filesystem execution remain unavailable through this boundary.


## 1.0.0-rc.6 — Secure Execution Gateway

- Added a final execution-policy boundary between authorized agent envelopes and host/tool executors.
- Enforced session binding, capability scope, immutable tool risk, replay protection, approval digest binding, execution TTL, timeout/cancellation, and bounded results.
- Host integrations must provide explicitly registered sandboxed executors; no shell/eval/host API surface is exposed by the gateway.


## 1.0.0-rc.3 — Spatial & Privacy Hardening

- Added local camera gesture adapter with injected landmark detector.
- Added gesture confidence thresholds, smoothing, pinch hysteresis and anti-chatter cooldowns.
- Added explicit gesture-session activation and UI-only gesture command boundaries.
- Added explicit screen-analysis consent lifecycle.
- Added screen-analysis pixel-budget enforcement and semantic-result redaction.
- Added remote-analysis redactor enforcement and raw-frame release handling.

## 1.0.0-rc.2 — Security Hardening Candidate

- Hardened local development binding to loopback.
- Hardened WebSocket lifecycle against stale socket events and enforced authenticated session-bound events.
- Added outbound/inbound connector rate and message-size limits.
- Required authenticated WebSocket sessions to present a short-lived token.
- Added capability propagation to AI/backend commands and required authenticated sessions for capability grants.
- Added capability issuance time/expiry validation.
- Hardened postMessage origin/source-window and authentication handling.
- Added VLM request/response size controls and timeout/cancellation handling.
- Added privacy policy validation and a required pre-send redaction boundary for remote screen analysis when redaction is enabled.
- Added result-summary redaction as a defense-in-depth measure.
- Added release verification tooling, workflow SHA verification and deterministic-build documentation.
- Added SBOM/provenance steps to the stable release workflow.
- Expanded setup, testing, accessibility, performance, AI, gesture, desktop, extension and operations documentation.

## 1.0.0 — stable release target (not yet promoted)

The stable release remains gated on deterministic lockfiles, networked build/test verification, supported desktop builds, dynamic security testing, performance/privacy/accessibility validation and independent security review.

## 1.0.0-rc.4 — AI/VLM Trust Boundary

- Added strict AI action-proposal validation and capability/session binding.
- AI proposals can only map to an allowlisted UI command set; the boundary never executes actions.
- High/critical AI proposals carry an approval requirement by default.
- Hardened VLM JSON parsing with Zod validation, bounded streaming response reads, timeout/cancellation, and session/correlation context headers.
- Preserved remote screen privacy gating and semantic-result sanitization.

## 1.0.0-rc.5

### Added
- Agent/tool execution trust boundary with registered-tool allowlisting.
- Capability-scope enforcement, immutable tool risk, replay protection, argument limits, and HITL approval binding.
- Agent/tool execution boundary documentation and release gates.

## 1.0.0-rc.8 — Platform Security & Provenance

- Added bounded native-host request rate and execution budgets.
- Added tamper-evident execution provenance chain using SHA-256 Web Crypto.
- Added explicit platform-security qualification boundary documentation.
- Preserved the constrained RC7 native operation vocabulary.

## 1.0.0-rc.9 — Native Qualification & Recovery
- Added fail-closed native host lifecycle recovery controller.
- Added declarative cross-platform security qualification policy.
- Added native boundary qualification script and security tests.
- Synchronized Tauri/Cargo/package release metadata to RC9.

## 1.0.0-rc.11

### Production Qualification
- Added a production qualification harness and machine-readable qualification report.
- Added explicit deterministic-install and clean-build gates.
- Added RC11 release qualification documentation.
- Preserved fail-closed status for unavailable dependency/toolchain verification.

## 1.0.0-rc.17.10-ci-native-build

- Added CI native build qualification workflow.
- Added locked Cargo check/test/clippy execution.
- Added exact Node 22.16.0 CI runtime.
- Added native build toolchain evidence artifact.
- Kept missing lockfiles fail-closed.
