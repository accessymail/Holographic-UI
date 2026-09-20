# RC14 — Dependency-Backed Build Evidence

## Objective

Replace architectural assumptions with dependency-backed build and test evidence.

## Required gates

1. Committed `package-lock.json`.
2. Clean `npm ci`.
3. TypeScript typecheck.
4. Complete Vitest suite.
5. Production Vite build.
6. Committed `src-tauri/Cargo.lock`.
7. `cargo check --locked`.
8. Machine-readable qualification evidence.

The qualification harness fails closed: missing network, lockfiles, dependencies, or toolchains are recorded as `BLOCKED`, not `PASS`.
