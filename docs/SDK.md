# SDK

The package exposes a backend-neutral runtime through `@holographic-ui/core`.

```ts
import { createHUI, WebSocketConnector } from '@holographic-ui/core';

const connector = new WebSocketConnector({
  url: 'wss://gateway.example.com/hui',
  tokenProvider: async () => yourShortLivedAccessToken(),
  requireAuthentication: true
});

const hui = createHUI({ connector });
```

The connector should terminate at a trusted application gateway. Do not connect the HUI runtime directly to a shell, database, cloud credential, privileged API or unrestricted agent runtime.

For browser embedding use the `postMessage` connector with exact HTTPS origins on both sides.

For screen understanding, inject an implementation of `ScreenAnalyzer`. This lets the consuming platform choose a local VLM, a managed VLM gateway, an accessibility-tree analyzer, or another vision service without making the HUI package vendor-dependent.
