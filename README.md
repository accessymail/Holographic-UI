# Holographic UI

> **v1.0.0-rc.2 — security hardening release candidate** · MIT License

A production-oriented, backend-agnostic Holographic/FUI interaction runtime for AI-native web and desktop applications. Stable v1.0.0 remains gated by build, test, privacy, performance, desktop, supply-chain, and independent security-review requirements.

**Holographic UI is the presentation and interaction plane. Your platform remains the authority for identity, policy, AI/agent orchestration, memory, databases, secure execution and enterprise audit.**

```text
Your AI / Agents / VLM / RAG / DB / Identity / Policy / Execution
                              │
                       Trusted Gateway
                              │
                              ▼
                    ┌─────────────────┐
                    │ Holographic UI  │
                    │   v1.0.0-rc.2   │
                    └─────────────────┘
```

## Why this project exists

Most futuristic UI demos stop at visual effects. Holographic UI treats the interface as a reusable system: dynamic cards, stateful motion, AI-state visualization, gesture boundaries, screen-understanding boundaries, privacy controls, authenticated connectors, capability scoping, HITL approval UX, extension isolation, and a minimal native shell.

## Core features

- Dynamic floating cards: move, focus, resize, minimize/restore and auto-arrange.
- Holographic AI core with state-aware motion and reduced-motion support.
- `hui/1.0` versioned command/event protocol with strict runtime and JSON-schema validation.
- Expiring command envelopes, nonce replay protection, payload limits and inbound rate limiting.
- Session-bound capability registry for AI/backend-originated UI commands.
- Authenticated WebSocket connector with WSS-by-default and short-lived token provider support.
- Exact-origin/source validation for `postMessage` embedding.
- Human-in-the-loop approval UI whose final authorization remains backend-authoritative.
- Explicit, non-persistent screen-capture boundary.
- Provider-neutral gesture adapter and gesture-to-UI command session.
- Generic VLM/screen-understanding adapter so consumers can plug local or managed models.
- Sandboxed iframe extension boundary with exact HTTPS origin matching.
- Tauri desktop shell with zero native permissions by default.
- Security headers and privacy policies suitable for hardened deployments.
- Security-focused CI: dependency review/audit, CodeQL, secret scanning and build provenance hooks.
- Public TypeScript SDK entry point for connecting external AI platforms and gateways.

## Trust model

**Presentation is not authority.** AI output, VLM output, gesture input, screen context, plugin content and transport messages are untrusted.

Sensitive actions must follow:

```text
Input
  ↓
HUI protocol validation
  ↓
Identity / capability check
  ↓
Host policy / authorization
  ↓
HITL where required
  ↓
Secure execution gateway
  ↓
OS / external API
  ↓
Trusted audit / provenance
```

HUI itself intentionally does not expose a general shell, filesystem, credential store or arbitrary OS execution API.

## Quick start

Requirements: Node.js 22+.

```bash
npm install
npm run release:check
npm run dev
```

Desktop shell:

```bash
npm run tauri:dev
```

Production web build:

```bash
npm run build
```

## SDK integration

```ts
import { createHUI, WebSocketConnector } from '@holographic-ui/core';

const connector = new WebSocketConnector({
  url: 'wss://gateway.example.com/hui',
  tokenProvider: async () => fetchShortLivedAccessToken(),
  requireAuthentication: true
});

const hui = createHUI({ connector });
```

Your gateway owns authentication, authorization, AI/agent execution, databases, secrets, policy decisions and trusted audit. HUI only receives scoped state and requests through the connector contract.

## Screen understanding

Use `LocalScreenCapture` together with the generic `ScreenUnderstandingPipeline` and inject an implementation of `ScreenAnalyzer`.

That analyzer can be a local VLM, managed VLM gateway, accessibility-tree service or another vision system. The HUI package does not persist raw frames.

Browser screen capture is user-permissioned by the platform, and production deployments should additionally configure an appropriate `Permissions-Policy`. citeturn547554search0turn547554search2

## Desktop security

The included Tauri v2 shell starts with an empty permission set. Add native commands only when they are strictly required, scope them to the smallest capability and validate every parameter at the native boundary.

Tauri documents its security model and capability system as a boundary for controlling which frontend windows/webviews can access native functionality. citeturn547554search6turn547554search9

## Security methodology

The project uses OWASP ASVS 5.0.0 as an application-security verification reference and NIST SSDF 1.1 as a secure-development lifecycle reference. These frameworks provide requirements and development practices; they are not claims of certification. citeturn547554search1turn547554search3

## Repository structure

```text
src/
├── core/          protocol, capabilities, security, privacy, approvals, session
├── runtime/       HUI orchestration runtime
├── sdk/           public integration entry points
├── connectors/    WebSocket + postMessage
├── adapters/      gesture + screen + VLM boundaries
├── react/         React hook integration
├── ui/            holographic visual components
└── app/           reference application
src-tauri/         minimal native desktop shell
protocols/         JSON protocol schemas
docs/              architecture, security, privacy, SDK, release verification
examples/          mock backend gateway
scripts/           repository protocol and security checks
.github/           CI, security scanning and provenance workflows
```

## Production deployment

Use `docs/PRODUCTION-CHECKLIST.md`, `docs/SECURITY-TEST-MATRIX.md` and `docs/RELEASE-VERIFICATION.md` before a high-trust deployment.

The repository does **not** claim universal enterprise-security certification. A production integrator must still perform organization-specific identity, policy, privacy/DLP, infrastructure, incident-response and independent security testing.

## Attribution

Built with **ChatGPT as the primary engineering copilot and implementation partner**.

## License

MIT — see `LICENSE`.

## Certification

Enterprise certification requirements are defined in `docs/ENTERPRISE-CERTIFICATION.md`. Current release status is **NOT CERTIFIED** until all mandatory gates pass.
