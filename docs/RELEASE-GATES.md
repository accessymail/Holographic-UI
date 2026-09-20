# Production Release Gates

All mandatory gates must be evidenced against the exact release commit.

1. Source review and immutable commit
2. npm and Cargo lockfiles committed
3. clean production build
4. TypeScript and Rust checks
5. complete unit/integration/security tests
6. SAST, dependency and secret scanning
7. native capability authorization independent of renderer
8. native replay/rate limiting
9. OS sandboxing and privilege separation
10. IPC fuzzing and negative testing
11. filesystem escape and symlink-race testing
12. cross-platform qualification
13. exact-build SBOM
14. signed provenance/attestation
15. release artifact integrity verification
16. no unresolved release-blocking vulnerabilities
17. independent penetration test
18. operational/recovery documentation

No automated CI result alone constitutes enterprise-security certification.
