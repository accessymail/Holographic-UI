# Platform Isolation Release Evidence

A production release must attach evidence for every supported platform/architecture.

| Evidence | Required |
|---|---|
| OS isolation policy/profile | Yes |
| Native process identity and privilege level | Yes |
| Filesystem boundary test | Yes |
| Process-execution denial test | Yes |
| Network-default-deny test | Yes |
| IPC authorization tests | Yes |
| Escape/path traversal tests | Yes |
| Failure when isolation policy is missing | Yes |
| Signed installer/package | Yes |
| Independent security review | Yes |

Evidence must identify the exact source commit, build artifact, OS version, architecture, policy/profile version, and test result.
