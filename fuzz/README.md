# Native IPC fuzzing gate

This directory is the release-engineering scaffold for native IPC fuzzing.

## Scope

The fuzz target must exercise the native host request boundary with attacker-controlled:

- JSON shape and field types
- capability claims and signatures
- session/capability/operation bindings
- nonce/replay inputs
- expiry/clock values
- path and content fields
- oversized and malformed payloads

## Certification rule

A release is **not** certified until a supported Rust toolchain executes the fuzz target for the required campaign duration and the resulting report is attached to the release evidence pack. This scaffold is not evidence of a completed fuzz campaign.

## Planned implementation

The native protocol should be exposed through a small library boundary so the fuzz target can call parsing and authorization logic without starting the Tauri GUI process. Keep OS side effects behind an explicit executor trait and use a deterministic mock for parser/authorization fuzzing.

Recommended acceptance evidence:

1. corpus seed set committed;
2. deterministic regression cases for every previously discovered parser/authentication defect;
3. sanitizer-enabled fuzz build where supported;
4. campaign duration and executed inputs recorded;
5. zero unresolved crashes/panics/undefined behavior;
6. findings reviewed and linked to the vulnerability register.
