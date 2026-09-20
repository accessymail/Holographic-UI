# RC9 — Cross-Platform Native Qualification & Recovery

RC9 adds qualification controls around the native boundary without claiming that application policy is an OS sandbox.

## Fail-closed lifecycle

The host recovery controller enters `degraded` after repeated failures and permits only bounded recovery attempts after a cooldown. Recovery increments a generation and never grants capability authority.

## Platform policy

Windows, Linux, macOS, and unknown hosts use the same declarative minimum policy: sandbox required, filesystem/network default deny, no process execution, and privilege separation required. Native platform code must enforce these requirements.

## Qualification

`npm run qualify:native` performs a repository-level control-presence qualification. It is not a substitute for Windows/Linux/macOS execution testing, Tauri builds, OS sandbox verification, fuzzing, or an independent security review.
