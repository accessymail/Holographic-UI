# Platform Isolation Contract

Holographic UI uses application-level capability authorization as the security boundary inside the Tauri process. That boundary does **not** by itself prove OS-level sandboxing or privilege separation.

Production desktop deployments MUST add an OS-enforced isolation layer appropriate to the target platform. The application must run with least privilege and the native capability broker must remain fail-closed when the isolation profile is absent or invalid.

## Required properties

- No arbitrary shell/process execution from renderer IPC.
- Native broker runs without administrative/root privileges.
- Writable filesystem access is restricted to an application-owned data directory.
- Network access is denied by default unless explicitly required by a documented capability.
- Renderer-originated paths are treated as untrusted input.
- Isolation policy is versioned and validated before production release.
- Security evidence is collected per supported OS and architecture.

## Platform profiles

- Windows: AppContainer or an equivalent OS-enforced restricted-token/job model, with explicit capability/resource ACLs.
- macOS: sandbox entitlement/profile model with least-privilege file/network entitlements.
- Linux: a supported sandbox boundary such as a dedicated unprivileged service plus namespaces/seccomp/AppArmor or an equivalent enterprise control.

The exact mechanism is a deployment/packaging concern and must be validated on each supported OS. This repository does not claim that these controls are already active merely because this contract exists.
