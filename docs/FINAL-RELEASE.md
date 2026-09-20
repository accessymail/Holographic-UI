# Holographic UI Release Status — Pre-1.0.0

## Release goal

v1.0.0 will be the stable public release of the Holographic UI presentation/interaction runtime. It is designed to plug into an application's own AI, agents, VLMs, data layer, policy engine, identity provider and secure execution gateway.

## Release train

| Milestone | Deliverable | Result |
|---|---|---|
| RC1 | Core HUI + security architecture | Complete |
| RC2 | Buildable/testable SDK + public exports | Complete |
| RC3 | Gesture + privacy boundaries | Complete |
| RC4 | AI/VLM + screen-understanding adapters | Complete |
| RC5 | Secure desktop/host boundary | Complete |
| RC6 | Enterprise hardening + supply-chain CI | Complete |
| RC7 | Final validation gate | Complete to repository-level scope; environment-limited dependency execution is documented |
| v1.0.0 | Stable public release | BLOCKED until final release gates pass |

## Security position

The project is security-oriented and follows a defense-in-depth model. The UI is not a final trust authority. A consuming platform must retain authoritative identity, authorization, policy enforcement and execution controls.

The repository maps controls to OWASP ASVS 5.0.0 and NIST SSDF 1.1 concepts, and includes CI hooks for dependency review, static analysis, secret scanning and provenance-oriented release automation.

## Privacy position

Screen capture is explicit. `getDisplayMedia()` already requires a user permission flow in supporting browsers. HUI additionally defaults to non-persistent frames and exposes a privacy policy boundary. Remote analysis must be explicitly enabled by the host application.

## Production acceptance

Before deploying into a high-trust enterprise environment, the operator should still perform organization-specific threat modeling, identity integration, DLP/privacy review, penetration testing, incident-response preparation and independent security assessment. This repository does not claim a universal security certification.
