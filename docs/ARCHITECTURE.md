# Holographic UI Architecture

## Product definition

HUI is the presentation, visualization and interaction plane for AI-native systems. It is deliberately independent of the AI provider, database, agent framework and secure execution implementation.

## Planes

### Scene plane
Card scene graph, lifecycle, focus, z-order and layout.

### Motion plane
Interruptible transitions, spring movement, enter/exit choreography and reduced-motion behavior. Prefer transforms and compositor-friendly properties.

### Render plane
DOM for semantic controls/text, SVG for precise vector HUD elements, and GPU/canvas layers for high-frequency visual effects.

### Interaction plane
Pointer and keyboard are first-class. Gesture, vision and future spatial input are adapters.

### Command plane
Versioned commands, strict schemas, short TTL, nonce replay protection, payload limits and authority checks.

### Capability plane
Scoped, expiring grants bind AI-driven UI actions to a session. The frontend cannot mint authoritative execution capabilities.

### Integration plane
WebSocket and postMessage connectors share a common interface. Additional transports can be added without changing scene/UI code.

### Privacy plane
Screen capture is explicit, bounded and non-persistent by default. Remote analysis is a policy decision outside the renderer.

### Security plane
Client-side controls provide defense-in-depth. Authoritative identity, authorization, policy, execution and audit live in the host platform.

## Trust model

```text
UNTRUSTED INPUTS
 AI / VLM / Gesture / Plugin / Remote Event
                    │
                    ▼
             HUI Protocol
                    │
             Schema Validation
                    │
             Security Checks
                    │
             Capability Check
                    │
                    ▼
               HUI Scene
                    │
                    ▼
            Authenticated Gateway
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
     Policy       HITL       Audit
        │           │           │
        └───────────┼───────────┘
                    ▼
          Secure Execution Gateway
                    │
                    ▼
             OS / Enterprise API
```

## Extension model

Cards are declarative by default. Third-party arbitrary JavaScript must use a sandboxed iframe with an explicit HTTPS origin and message contract. Native-process extensions are not part of the trusted frontend core; they require a separately designed host security boundary.

## Desktop model

Tauri is the preferred shell because native privileges can be constrained using capabilities. The default capability grants no native permissions. Add permissions one feature at a time and keep windows from unnecessarily sharing broad capability sets.

## Backend-neutral contract

The frontend should not know whether the backend uses OpenAI, Anthropic, a local model, a custom model, an agent framework, RAG, a relational database, vector database or an enterprise workflow engine. The only contract exposed to HUI is typed state/events/commands through an authenticated integration gateway.
