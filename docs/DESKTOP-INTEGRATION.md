# Desktop / Tauri Integration

The default Tauri capability set grants no native permissions.

Add one native capability at a time and document:

1. the feature requiring the permission;
2. the exact command or API exposed;
3. validation of all arguments;
4. the calling window/webview;
5. the audit event;
6. the rollback/revocation path.

Native functionality that can create side effects should terminate in a separate least-privilege host adapter or execution gateway. Never expose a raw shell or unrestricted filesystem API to HUI cards.
