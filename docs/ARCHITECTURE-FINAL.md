# Final Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Holographic UI                                                      │
│                                                                     │
│ Scene / Cards / Core / Motion / Accessibility / Gesture Mapping     │
│                           │                                         │
│                    HUI/1.0 Protocol                                 │
│                           │                                         │
│          Connector + session + capability boundary                 │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
                    Authenticated Gateway
                           │
        ┌──────────────────┼────────────────────┐
        │                  │                    │
     AI / VLM          Policy / Identity    Audit / DLP
        │                  │                    │
        └──────────────────┼────────────────────┘
                           │
                 Secure Execution Gateway
                           │
                 Sandboxed host adapters
                           │
                 Operating system / APIs
```

## Trust boundaries

1. User input, gestures, AI/VLM output, screen-derived context and extension messages are untrusted.
2. The HUI renderer can display state and request operations, but cannot authorize privileged operations.
3. Native access is disabled by default in the Tauri shell.
4. Privileged execution belongs to a separate host gateway with its own identity, policy and audit controls.
