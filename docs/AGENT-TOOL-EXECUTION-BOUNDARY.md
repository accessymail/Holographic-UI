# Agent / Tool Execution Boundary

## Security invariant

`AGENT OUTPUT → VALIDATE → REGISTERED TOOL → CAPABILITY → SESSION → APPROVAL (if required) → EXECUTION GATEWAY`

Agent output is never an authority. A model cannot create a capability, expand a capability, change a tool's registered risk, or directly invoke a host/native function.

## Tool registration

Each tool has a fixed identifier, capability scope, risk level, description, and optional approval requirement. The host owns this registry.

## Authorization

A call must have a valid session, live capability grant, matching immutable risk, registered tool, bounded arguments, and a fresh nonce. Capability scope is checked against the registered tool scope rather than any scope supplied by the model.

## HITL

High and critical risk calls require an approval request. The approval request contains a digest of the exact tool arguments so an approval cannot silently be reused for changed parameters.

## Execution

This boundary deliberately does not execute tools. A later secure execution adapter must consume only an authorized result and independently enforce its own host/OS policy, sandboxing, timeout, audit, and provenance requirements.
