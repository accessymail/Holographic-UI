# Testing Guide

Holographic UI uses multiple test layers. A passing unit suite alone is not a production release gate.

## Local checks

```bash
npm ci
npm run check
```

`npm run check` validates the TypeScript build, unit tests, protocol schemas, static security rules, workflow pinning and release metadata.

## Security testing

Run dependency audit, SAST/CodeQL, secret scanning, protocol fuzzing and DAST against a deployed reference gateway. Include malformed commands/events, replay, session confusion, oversized payloads, unauthorized capabilities and extension-origin violations.

## End-to-end testing

Test browser, embedded and Tauri modes from a clean machine. Cover connection failure, reconnect, authentication expiration, capability expiry, HITL approval, gesture fallback and denied screen-capture permission.

## Release evidence

Archive CI logs, test reports, SBOM, artifact checksums/attestations and the independent security review with the release record.
