# RC15 — Release Integrity & SBOM Evidence

## Objective

Establish artifact-level integrity evidence without pretending that declared dependency versions are resolved dependency provenance.

## Gates

- Package version format is validated dynamically.
- Release files receive SHA-256 integrity records.
- Integrity records are revalidated before packaging.
- A CycloneDX-compatible SBOM records declared dependencies.
- The SBOM is explicitly marked `declared-dependencies-only` until `package-lock.json` and a clean dependency-backed installation exist.
- Generated integrity artifacts are excluded from their own hash set.
- Qualification scripts use dynamic RC version validation instead of hardcoded historical release numbers.

## Certification boundary

This release does not certify dependency resolution, vulnerability status, reproducible compilation, native OS isolation, or signed provenance. Those require lockfile-backed installation and platform build evidence.
