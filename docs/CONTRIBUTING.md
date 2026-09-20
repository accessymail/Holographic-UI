# Contributing

## Principles

Keep the core runtime backend-agnostic and vendor-neutral. Prefer explicit contracts over hidden coupling.

Do not put host privileges into UI components. New privileged functionality should be proposed as an external adapter or capability boundary.

## Before opening a pull request

```bash
npm ci
npm run check
```

Include tests for protocol, security or layout changes.
