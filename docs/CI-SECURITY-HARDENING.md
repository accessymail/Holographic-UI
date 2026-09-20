# CI / Supply-Chain Hardening

GitHub recommends pinning actions to full-length commit SHAs so workflow dependencies are immutable. The release workflows should keep all third-party actions pinned and should update those pins through reviewed dependency-update pull requests.

The repository uses:

- least-privilege workflow permissions
- `persist-credentials: false` on checkout
- dependency review
- CodeQL
- secret scanning
- dependency audit
- artifact provenance/attestation

A committed npm lockfile is required before the final stable release. Until that lockfile is present and verified in a networked CI run, the release must remain an RC/pre-release.
