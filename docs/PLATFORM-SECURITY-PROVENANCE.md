# Platform Security & Execution Provenance — RC8

## Security boundary

`Agent → Tool Authorization → Secure Execution Gateway → Native Host Boundary → Platform Policy → OS`

RC8 adds two controls:

1. **Platform policy metadata** constrains what the native adapter may request and provides bounded request rate/execution budgets.
2. **Execution provenance** records a tamper-evident in-memory hash chain for accepted executions.

## Platform enforcement status

The project does **not** claim that a TypeScript policy or Tauri permission file is equivalent to an OS sandbox. Actual privilege isolation remains platform-specific and must be verified on each supported desktop target.

The current native surface deliberately exposes only the RC7 sandbox operations. No shell, arbitrary process, unrestricted filesystem, or native network executor is introduced by RC8.

## Provenance

Each accepted execution may produce:

- execution ID;
- tool and native operation;
- session/capability identifiers;
- correlation ID;
- risk level;
- start/completion timestamps;
- outcome/reason;
- previous-record digest;
- SHA-256 record digest.

The chain is intentionally in-memory. Durable audit storage, signed attestations, and remote audit transport are separate deployment concerns.

## Release qualification

Required before stable production claims:

- Windows native build and policy validation;
- Linux native build and policy validation;
- macOS native build and policy validation;
- OS-level privilege/sandbox verification;
- native IPC fuzzing;
- crash/recovery testing;
- dependency-backed Rust/TypeScript tests;
- independent security review.
