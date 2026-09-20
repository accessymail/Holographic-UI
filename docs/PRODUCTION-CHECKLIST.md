# Production Readiness Checklist

A deployment should not be described as enterprise-secure until the host integration completes this checklist and performs an independent security review.

## Application

- [ ] HTTPS/WSS only outside localhost development.
- [ ] Strong CSP deployed by the hosting environment.
- [ ] No secrets in frontend bundles.
- [ ] Exact allowed origins configured.
- [ ] Authentication and session expiration implemented by the backend.
- [ ] Backend authorization enforced for every privileged action.
- [ ] Capability grants are short-lived, scoped and revocable.
- [ ] HITL approvals are bound to command ID, parameters, session and expiry.
- [ ] Audit events are exported to a trusted backend.

## Desktop

- [ ] Tauri capabilities reviewed per application feature.
- [ ] No unnecessary native plugins installed.
- [ ] Native commands validate caller context and all parameters.
- [ ] Remote navigation/web content disabled unless explicitly required.
- [ ] Release artifacts are signed by the publisher.

## Privacy

- [ ] Screen capture is visibly indicated and user/policy controlled.
- [ ] Remote analysis is opt-in or enterprise-policy controlled.
- [ ] Sensitive regions are redacted where feasible.
- [ ] Raw frames are not persisted by HUI.
- [ ] Host retention/DLP controls are documented.

## Supply chain

- [ ] Dependency lockfile committed.
- [ ] Dependency and license review completed.
- [ ] SAST, dependency scanning and secret scanning enabled.
- [ ] SBOM generated for releases.
- [ ] Build provenance/attestation enabled.
- [ ] Release artifacts have checksums and signatures.

## Verification

- [ ] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Security regression suite passes.
- [ ] Performance budgets pass on supported hardware.
- [ ] Accessibility checks pass.
- [ ] External penetration/security review completed.
