# Security Test Matrix

| Area | Control | Automated evidence | Operator responsibility |
|---|---|---|---|
| Protocol | strict schema validation | unit tests + schema files | gateway validation |
| Replay | nonce cache | unit tests | distributed/session replay defense in gateway |
| TTL | expiring commands | unit tests | authoritative backend re-validation |
| Origin | exact origin/source checks | connector code | deployment origin allowlist |
| Transport | WSS by default | connector guard | certificate lifecycle |
| Capability | scoped session grants | unit tests | capability issuance + revocation |
| HITL | decision is a UI event only | runtime checks | backend verifies exact request + digest |
| Screen privacy | explicit capture, no frame retention | privacy adapter | DLP/redaction policy |
| Extension isolation | sandboxed iframe, exact origin | component code | signed extension supply chain |
| Native boundary | no default Tauri permissions | capability manifest | only add narrowly scoped commands |
| Supply chain | audit/review/scanning hooks | GitHub workflows | lockfile review, signing, provenance |
| Secrets | no secrets in source | gitleaks hook | secret management in deployment |
