# RC11 — Production Qualification

RC11 is a verification-focused release candidate. It does not convert unverified platform assumptions into certification claims.

## Qualification contract

1. Node.js 22 is required.
2. `package-lock.json` is required for deterministic npm installation.
3. `src-tauri/Cargo.lock` is required for deterministic Rust/Tauri builds.
4. A clean environment must execute `npm ci --ignore-scripts --no-audit --no-fund` successfully.
5. TypeScript typecheck, Vitest, and production build must pass from that clean install.
6. Tauri builds must pass on every supported target.
7. Native sandbox, IPC, privilege, filesystem, network and recovery controls must be tested on the actual target OS.
8. SBOM and artifact provenance must be generated from the release build.
9. Independent security testing must close all release-blocking findings.

## Current environment result

The RC11 source tree was inspected in an environment with Node.js 22 and npm available, but without Cargo/Rust. The npm registry was also unavailable to the execution environment, so a new deterministic `package-lock.json` could not be generated or dependency-backed tests/builds executed.

Therefore RC11 is a **qualification harness**, not a production certification. `production-qualification.json` records the machine-readable result.

## Release rule

RC11 must not be represented as `v1.0.0` until every blocked gate above has evidence from a clean, dependency-complete, target-platform build environment.
