# Security Policy

## Scope

This repository contains a frontend runtime, browser/webview integration layer and a minimal Tauri shell. It intentionally does **not** act as a trusted authorization or operating-system execution authority.

## Supported releases

The `v1.0.x` line receives security fixes while supported by maintainers. Older release lines may be archived.

## Reporting a vulnerability

Please report suspected vulnerabilities privately through the repository's configured security contact / GitHub Security Advisories. Do not publish exploit details before maintainers have had an opportunity to assess and remediate the issue.

## Security model

- AI, VLM, gesture, plugin and transport input is untrusted.
- The UI is a presentation/interaction plane, not the final authorization plane.
- Sensitive actions must be re-authorized by the host platform immediately before execution.
- Native permissions remain disabled by default in the Tauri shell.
- Screen capture is explicit and non-persistent by default.

## Release assurance

The release workflow includes static checks, protocol validation, dependency audit hooks, CodeQL, secret scanning and provenance-oriented CI. A consuming organization remains responsible for its identity provider, backend authorization, data-loss-prevention controls, infrastructure, secrets, logging, incident response and independent security assessment.
