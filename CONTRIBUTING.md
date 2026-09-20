# Contributing

1. Open an issue for substantial design changes before implementation.
2. Keep public APIs backwards compatible within a major version.
3. Add tests for protocol, security, privacy and state-machine changes.
4. Do not add native permissions, remote code loading, shell execution, or credential handling without a documented threat-model update.
5. Run `npm run release:check` before opening a pull request.

Security issues must be reported through the process in `SECURITY.md`, not as public issues.
