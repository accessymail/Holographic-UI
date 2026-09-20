# Production Integration Guide

HUI is intentionally backend-agnostic.

## Recommended topology

```text
User / Operator
      │
      ▼
 Holographic UI
      │
      │ authenticated connector
      ▼
 Integration Gateway
      │
      ├── Identity / Session
      ├── Policy / Authorization
      ├── Capability Service
      ├── HITL / Approval Service
      ├── AI / Agent Runtime
      ├── Memory / RAG / Database
      ├── Screen/Vision Service
      └── Secure Execution Gateway
```

## Important rule

Do not connect HUI directly to an OS shell, unrestricted filesystem API, cloud credential store or arbitrary agent tool.

The integration gateway should expose only typed operations that HUI is allowed to request.

## WebSocket

Use `wss://` and a short-lived token provider. Do not hard-code tokens in the frontend. The server should authenticate the session, issue scoped capabilities and send a `READY` event only after successful authentication.

## Embedded mode

Use `PostMessageConnector` with an exact HTTPS `targetOrigin` and an exact source-window check. Never use `*` for production commands.

## AI integration

The AI should produce structured intent. The backend translates intent into an authorized operation. HUI visualizes the state and collects operator input; it is not an authorization authority.
