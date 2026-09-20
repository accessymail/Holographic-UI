#![no_main]
use libfuzzer_sys::fuzz_target;

#[path = "../../src-tauri/src/security/capability.rs"]
mod capability;

fuzz_target!(|data: &[u8]| {
    // Fuzz only the pure parser/authentication boundary. No filesystem, process,
    // network, or GUI side effects are reachable from this target.
    let token = String::from_utf8_lossy(data);
    let _ = capability::verify_capability_token(
        &token,
        "capability",
        "session",
        "host.ping",
        "low",
        "nonce-0123456789",
        1_000_000,
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    );
});
