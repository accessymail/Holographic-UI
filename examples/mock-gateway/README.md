# Mock Gateway

Development-only reference integration for the HUI WebSocket connector.

```bash
npm install
HUI_GATEWAY_TOKEN=development-only-token npm start
```

For the local Vite demo, enable localhost transport explicitly in the connector configuration. Never expose this gateway publicly and never use its development token in production.

The production gateway should replace this example with your identity/session provider, capability service, authorization/policy engine, audit pipeline and secure execution gateway.
