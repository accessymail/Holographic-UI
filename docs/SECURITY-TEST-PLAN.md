# Security Test Plan

## Automated security gates

- strict protocol/schema validation
- replay and TTL regression tests
- capability/session tests
- rate-limit tests
- static forbidden-pattern scan
- dependency vulnerability scan
- secret scan
- CodeQL
- dependency review on pull requests

## Dynamic tests

- invalid/malformed WebSocket frames
- oversized messages and JSON bombs
- stale/future timestamps
- nonce replay
- capability mismatch and expired grants
- origin/source confusion in postMessage
- XSS payloads in card title/message fields
- untrusted extension behavior
- VLM malformed/oversized responses
- timeout and cancellation behavior
- camera/screen permission denial
- local/remote privacy policy enforcement

## Performance/security interaction

Check that rate limiting, payload limits and card/particle limits cannot be bypassed to create unbounded CPU, memory or GPU consumption.
