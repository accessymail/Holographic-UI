# RC4 — AI/VLM Trust Boundary

## Security invariant

**AI output is untrusted input.** A model response is never treated as authorization and never executes a tool, OS action, network action, or arbitrary HUI command.

The only AI-to-UI path is:

`VLM/AI output → strict schema → allowlisted intent mapping → session binding → capability check → HUI command validation → existing runtime/approval path`

Capabilities are issued by the host/session authority. The AI boundary cannot create, widen, or renew a capability.

## Allowlisted AI intents

RC4 permits only the existing UI command types that have bounded payload schemas:

- `CARD_OPEN`, `CARD_CLOSE`, `CARD_FOCUS`
- `CARD_MINIMIZE`, `CARD_RESTORE`, `CARD_MOVE`, `CARD_RESIZE`, `CARD_ARRANGE`
- `CORE_STATE`, `NOTIFY`

Native execution, filesystem, process, network, device, clipboard, or arbitrary tool invocation is outside this adapter.

## Session and replay context

Every AI action proposal carries a session ID, capability ID, and nonce. The capability registry enforces session binding and expiry; the command security layer enforces command expiry and nonce replay protection.

## HITL

`high` and `critical` proposals require approval by default. The trust boundary only marks the command as requiring approval. It does not approve or execute the command.

## VLM response boundary

Remote VLM responses are constrained by:

- HTTPS-only endpoint
- explicit content type
- bounded request and response sizes
- bounded streaming reads (prevents trusting `Content-Length` alone)
- timeout and caller cancellation
- strict Zod response schema
- bounded entity count/string lengths
- no credential persistence
- `credentials: omit` and `no-store`

Session/correlation identifiers may be supplied as context headers, but they are correlation metadata—not authorization. Authorization remains local to the HUI capability/session boundary.

## Privacy

The screen-understanding pipeline remains responsible for explicit consent, remote-analysis policy, redaction, pixel limits, semantic-result sanitization, and raw-frame release. The VLM client does not bypass those controls.
