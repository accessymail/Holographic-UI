# Security Control Mapping

This is an engineering mapping, not a compliance certification.

| Control objective | HUI implementation | Host responsibility |
|---|---|---|
| Input validation | Zod command/event/wire schemas | Validate again at gateway |
| Authentication | Connector token-provider handshake | Identity provider, token issuance and revocation |
| Authorization | Capability registry + authority rules | Authoritative policy engine |
| Replay protection | Nonce + TTL + session binding | Server-side replay protection |
| Least privilege | Tauri capability baseline; no native permissions | Native gateway permissions |
| XSS reduction | React, CSP baseline, no arbitrary HTML APIs | Deployment CSP and dependency hygiene |
| Extension isolation | Sandboxed iframe boundary | Extension origin and signing policy |
| Privacy | Screen consent/policy controller, no frame persistence | DLP, retention, legal/compliance controls |
| HITL | Approval request/decision UI | Bind approval to exact action and enforce server-side |
| Audit | Local correlation/audit trail | Trusted immutable/central audit sink |
| Supply chain | CI audit/CodeQL/secret scanning/provenance workflow | Lockfile, signing keys, release approvals, artifact registry |
| Resilience | Bounded payloads, reconnect backoff, finite buffers | Rate limits, quotas, gateway HA |
