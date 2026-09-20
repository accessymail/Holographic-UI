# User Setup Guide

Holographic UI is a frontend/runtime layer. The consuming platform remains authoritative for identity, authorization, AI execution, data, secrets, policy and secure OS actions.

## 1. Local development

Requirements:

- Node.js 22 or newer
- A modern Chromium/WebKit/Firefox-class browser for the web reference application
- Rust tooling for the Tauri desktop shell

Install and verify:

```bash
npm install
npm run check
npm run dev
```

The development server binds to `127.0.0.1` by default. Do not expose the Vite development server to untrusted networks.

## 2. Connect your platform

Implement the `HoloConnector` interface or use the WebSocket connector.

Your gateway should provide:

- authenticated sessions
- short-lived capability grants
- command authorization
- backend-side HITL verification
- trusted audit logging
- rate limits and abuse controls
- secret management outside the browser

Never connect the browser directly to an unrestricted shell, database, cloud credential, or native execution API.

## 3. WebSocket production configuration

Use `wss://` and supply a token provider for authenticated sessions.

```ts
new WebSocketConnector({
  url: 'wss://hui.example.com/session',
  tokenProvider: async () => getShortLivedAccessToken(),
  requireAuthentication: true
});
```

Tokens must be short-lived and scoped by the backend. Do not place long-lived API keys in Vite environment variables shipped to browsers.

## 4. Screen understanding

Screen capture is user-consent based by default. Remote analysis must be explicitly enabled by the host policy. HUI does not intentionally persist raw frames.

The host application is responsible for:

- DLP policy
- sensitive-region handling
- retention policy
- model-provider contracts
- enterprise logging/privacy requirements

## 5. Gesture input

HUI accepts normalized landmark data through a vendor-neutral adapter. Integrators should keep camera processing local when practical and expose a clear camera-active state to users.

## 6. Desktop/Tauri

The default Tauri capability manifest grants no native permissions. Add only the specific capability required by a feature, review the native command implementation, validate all parameters, and keep remote web content outside the privileged surface.

Build:

```bash
npm run tauri:build
```

## 7. Production release

Do not deploy solely from a local `npm run dev` session. Follow `docs/PRODUCTION-CHECKLIST.md`, `docs/RELEASE-VERIFICATION.md`, and `docs/PENTEST-PLAN.md`.
