# RC13 — Cross-Platform Qualification

RC13 establishes the reproducible web-runtime qualification path across Linux, macOS, and Windows.

## Supported qualification targets

- Linux x64: Ubuntu 24.04
- macOS arm64: macOS 14
- Windows x64: Windows Server 2025 runner
- Node.js 22

## Required gates

1. Committed `package-lock.json`.
2. `npm ci` without lifecycle scripts.
3. TypeScript typecheck.
4. Complete Vitest suite.
5. Production Vite build.
6. Cross-platform qualification report.

The workflow uses immutable GitHub Action SHAs. It intentionally fails closed when the deterministic npm lockfile is absent.

## Native/Tauri boundary

RC13 does not claim native OS certification. Rust/Tauri qualification remains a separate platform gate and requires a networked environment with the Rust toolchain and committed `src-tauri/Cargo.lock`.

## Current environment limitation

The development environment used to prepare RC13 has no installed project dependencies and no Cargo/Rust toolchain. Therefore dependency-backed verification is recorded as blocked rather than represented as passed.
