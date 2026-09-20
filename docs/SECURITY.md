# Security Architecture

## Security position

HUI is a security-conscious presentation runtime, not an execution authority. It follows the principle **presentation is not authority**.

The architecture is designed around OWASP ASVS 5.0 as a verification reference and NIST SSDF as the secure-development lifecycle reference. OWASP describes ASVS as a basis for testing application technical security controls, and NIST SSDF provides secure-development practices for reducing vulnerabilities and their impact.

## Browser security

Production deployments should use a restrictive CSP, HTTPS/WSS, exact origins, no client-side secrets and strict schema validation. For embedded deployments, exact `postMessage` target origins and source-window validation are mandatory.

## Desktop security

Tauri capabilities are the native privilege boundary. Keep capabilities minimal and avoid combining unrelated windows into a broad capability because Tauri notes that permissions from multiple capabilities can merge their security boundaries.

The included Tauri capability grants no native permissions by default. Tauri's CSP support should be configured as narrowly as the application permits.

If Electron is used as an alternative shell, apply context isolation, sandboxing, restrictive CSP, secure-only content, navigation restrictions and IPC sender validation. Electron documents these as core security recommendations.

## AI and execution security

AI, VLM, gesture and third-party extension output is untrusted input. Sensitive actions must pass through the host platform's authentication, authorization, capability and policy layers. HITL approval in the HUI is only a user-interface event; the backend must independently verify the approval before executing side effects.

## Supply chain

Release automation should generate SBOMs, scan dependencies, sign artifacts and publish build provenance. SLSA 1.2 defines provenance as verifiable information that tracks an artifact back through the build process and supports incremental supply-chain security guarantees.

## Incident response

The host deployment should have a security contact, vulnerability disclosure process, dependency-update policy, credential-revocation process and release rollback procedure before production launch.
