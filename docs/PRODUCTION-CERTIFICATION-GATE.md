# Production Certification Gate

`npm run certify:production` is the final fail-closed certification gate.

It intentionally distinguishes **PASS** from **REQUIRES_EVIDENCE** and **BLOCKED**. A missing lockfile, unavailable toolchain, unexecuted test suite, absent SBOM/provenance, incomplete OS isolation, incomplete fuzzing, or incomplete independent penetration test cannot be treated as a successful release gate.

## Certification rule

A release is `CERTIFIED` only when every mandatory evidence item is explicitly verified in the release evidence pack. The script does not fabricate test results, lockfiles, SBOMs, provenance, signatures, or security approvals.

## Current baseline

For **RC18 Production Candidate**, certification remains `NOT_CERTIFIED` until the controlled build/security environment supplies and verifies the missing evidence. This is deliberate: the project must fail closed rather than create a false production-security claim.
