# Secure Execution Gateway — RC6

## Security boundary

`Agent → Tool Authorization → HITL → Execution Envelope → Secure Execution Gateway → Sandboxed Executor → Host/OS`

The gateway is the final policy check before an executor is invoked. Agent output is never treated as executable code.

## Guarantees

- The envelope must belong to the active session and be unexpired.
- Capability scope and risk are revalidated at execution time.
- The registered tool and executor risk levels must match.
- Each execution envelope is single-use through replay protection.
- Approval, when required, is bound to the exact argument digest and command/envelope ID.
- Execution has a bounded lifetime and receives an `AbortSignal`.
- Serialized execution results are size bounded.
- Executors must explicitly declare themselves sandboxed.
- The gateway exposes no shell, `eval`, process, filesystem, or network API.

## Important deployment boundary

`allowFilesystem`, `allowProcess`, and `allowNetwork` are policy declarations passed to the executor. They are not browser-level enforcement by themselves. Native integrations must enforce these policies using OS sandboxing, container isolation, capability dropping, or equivalent mechanisms and must be tested independently.
