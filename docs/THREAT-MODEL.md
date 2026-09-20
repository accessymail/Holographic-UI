# Holographic UI Threat Model

Version: 1.0.0

## Trust boundaries

1. **Renderer boundary** — all UI JavaScript, cards and gesture adapters are treated as potentially compromised.
2. **Connector boundary** — WebSocket/postMessage/desktop bridges are untrusted transports until authenticated and validated.
3. **Policy boundary** — authorization, capability issuance and execution decisions belong to the user's trusted backend.
4. **Execution boundary** — native/OS actions must occur outside HUI behind a dedicated least-privilege gateway.
5. **Screen-data boundary** — captured frames are sensitive data and are opt-in, non-persistent by default and subject to policy.

## Threats and controls

| Threat | Primary controls |
|---|---|
| XSS / DOM injection | React escaping, strict CSP, no `dangerouslySetInnerHTML`, schema validation |
| Malicious card/plugin | declarative cards by default; sandboxed extension boundary; no native privileges |
| AI prompt injection | AI cannot directly execute OS actions; backend policy and capability checks |
| Command replay | nonces, short TTL, session binding, sequence support |
| Command tampering | authenticated transport; optional server-side message integrity; backend revalidation |
| Unauthorized execution | capability scope + backend authorization + HITL for configured risk |
| WebSocket downgrade | WSS required except explicitly enabled localhost development |
| postMessage confused deputy | exact target origin + exact source window + handshake token |
| Oversized payload / DoS | byte limits, bounded reconnect, bounded audit/event buffers |
| Screen privacy leakage | explicit capture, local-first processing, no frame persistence, redaction policy |
| Supply-chain compromise | lockfile, dependency review, audit/scanning, SBOM/provenance in release pipeline |
| Native privilege escalation | Tauri capabilities with least privilege; no default native permissions |

## Security invariant

**The frontend is never the final authority for authorization or execution.**

A production integration MUST independently authenticate the user/session, authorize every sensitive action, enforce capabilities and re-check approval/parameters immediately before side effects.
