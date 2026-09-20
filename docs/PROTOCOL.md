# HUI Protocol v1.0

HUI uses a small, explicit protocol. Commands describe what the interface should visualize or request; they are never arbitrary OS commands.

## Command envelope

```json
{
  "protocol": "hui/1.0",
  "id": "command-id",
  "type": "CARD_FOCUS",
  "payload": { "id": "agents" },
  "source": "ai",
  "authority": "session",
  "createdAt": 1760000000000,
  "expiresAt": 1760000007000,
  "sessionId": "session-id",
  "nonce": "unique-nonce",
  "capabilityId": "capability-id"
}
```

AI-originated commands must use session authority and a valid, scoped capability. User and gesture commands use UI authority.

## Wire envelope

WebSocket transports wrap messages in one of these kinds:

- `HELLO` — establishes protocol version and a random client nonce.
- `AUTH` — presents a short-lived backend-issued token bound to the client nonce.
- `EVENT` — carries a validated HUI event.
- `COMMAND` — carries a validated HUI command.
- `PING` — optional keepalive.

Production transports must use WSS. Localhost development can explicitly opt into insecure `ws://` through a development-only setting.

## Command categories

`CARD_*` changes the visual scene.

`CORE_STATE` changes the visible AI lifecycle state.

`NOTIFY` renders user-visible information.

`REQUEST_APPROVAL` expresses that a separate policy/HITL workflow is required. It is never permission to execute an action.

## Security properties

- Strict protocol version.
- Strict object schemas.
- Command payload schemas per command type.
- Short command TTL.
- Clock-skew tolerance.
- Random nonce/replay protection.
- Session binding.
- Capability binding for AI-originated commands.
- Maximum payload size.
- Explicit authority/source rules.

## Compatibility

Unknown command/event types are rejected. New protocol versions must be introduced explicitly rather than silently changing semantics under the same version string.
