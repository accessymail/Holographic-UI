# Roadmap

## Stable target: v1.0.0 (release-gated)

The following are included in the stable release:

- Holographic scene, dynamic cards and motion system.
- Public TypeScript runtime/SDK boundary.
- `hui/1.0` command/event protocol and JSON schemas.
- Session-bound capabilities, replay protection, TTL, rate limiting and payload limits.
- Authenticated WSS connector and exact-origin postMessage connector.
- HITL approval protocol with parameter-digest support.
- Privacy-gated screen capture and generic VLM/screen-understanding adapters.
- Vendor-neutral gesture pipeline.
- Sandboxed extensions.
- Minimal-permission Tauri shell.
- Security headers, CI security checks and provenance workflow.
- MIT license and production/integration documentation.

## Future major releases

Future work can extend the stable protocol without changing the trust model:

- Optional dedicated MediaPipe integration package.
- Accessibility-tree adapters.
- Signed extension packages and verification.
- OS-specific secure execution gateways.
- Enterprise OIDC/SCIM examples.
- Advanced observability and distributed audit adapters.
- GPU/WebGPU rendering package for large particle/3D scenes.
