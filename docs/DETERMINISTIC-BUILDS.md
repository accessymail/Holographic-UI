# Deterministic Builds

Production releases must use committed lockfiles for both JavaScript and Rust.

## Node.js

On a networked, trusted development machine:

```bash
npm install
```

This creates `package-lock.json`. Commit it and use:

```bash
npm ci --ignore-scripts --no-audit --no-fund
```

in CI and release builds.

## Rust / Tauri

Because the desktop shell is an application binary, `src-tauri/Cargo.lock` must be committed for reproducible release builds.

From a networked Rust toolchain:

```bash
cd src-tauri
cargo generate-lockfile
```

Commit `src-tauri/Cargo.lock` and verify the release with `cargo check --locked` / the Tauri build pipeline.

## Release rule

A stable `v1.0.0` build is blocked unless both lockfiles are present and all CI/release workflows use immutable action SHAs.
