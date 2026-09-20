# Native IPC Fuzzing Plan

## RC17.4 implementation boundary

The native capability parser and Ed25519 authorization verifier are isolated in `src-tauri/src/security/capability.rs`. The fuzz target imports that same module directly, so fuzzing exercises the production authorization logic rather than a copied implementation.

## Target

`fuzz/native-ipc/fuzz_target.rs` accepts arbitrary bytes as an attacker-controlled capability token and exercises JSON parsing, claim validation, TTL/clock validation, nonce binding, key decoding, signature decoding, and signature verification. It has no GUI, filesystem, process, or network side effects.

## Required certification evidence

- Rust toolchain version and target triple
- exact fuzz source commit
- corpus hash/list
- sanitizer configuration where supported
- duration and execution statistics
- crash/panic/UB result
- minimized regression artifacts for every discovered issue
- reviewer sign-off and vulnerability-register references

A fuzz scaffold or a successful compilation alone is not certification evidence.
