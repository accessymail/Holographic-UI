# Native Host Security Boundary — RC7

## Security invariant

The native bridge is a **policy-enforcement boundary**, not a capability issuer:

`Agent → Tool Boundary → Secure Execution Gateway → NativeHostBoundary → Tauri IPC → OS sandbox directory`

The native command must never accept a shell command, executable path, arbitrary IPC method, dynamic plugin name, or unrestricted filesystem path.

## RC7 operation vocabulary

Only these operations are exposed:

- `host.ping` — low-risk health probe.
- `sandbox.read_text` — reads UTF-8 text only from the HUI sandbox root and is size bounded.
- `sandbox.write_text` — writes UTF-8 text only inside the HUI sandbox root and is size bounded.

Process execution, shell access, arbitrary network access, clipboard access, and unrestricted filesystem access are deliberately not implemented.

## Host invariants

The Rust boundary enforces:

- sandbox-only execution;
- minimum identity fields;
- bounded paths and content;
- path traversal rejection;
- canonicalized existing paths;
- canonicalized parent checks for new files;
- no path escaping outside the sandbox root;
- bounded file reads;
- no capability issuance or elevation.

The TypeScript boundary additionally enforces:

- strict Zod request schema;
- fixed operation enum;
- session binding;
- nonce replay protection;
- payload bounds;
- cancellation before IPC.

## Important qualification

This RC is **not a claim of a complete OS sandbox**. The current implementation constrains file operations to an application-owned directory and provides no process/network executor. Strong OS-level isolation, privilege dropping, platform-specific sandbox profiles, and independent desktop security testing remain release gates for stable production deployment.
