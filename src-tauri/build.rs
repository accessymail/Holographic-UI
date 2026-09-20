fn main() {
    println!("cargo:rerun-if-env-changed=HUI_CAPABILITY_ISSUER_PUBLIC_KEY_B64");
    if std::env::var("PROFILE").as_deref() == Ok("release")
        && std::env::var("HUI_CAPABILITY_ISSUER_PUBLIC_KEY_B64").map(|v| v.trim().is_empty()).unwrap_or(true)
    {
        panic!("HUI_CAPABILITY_ISSUER_PUBLIC_KEY_B64 must be configured for release builds");
    }
    tauri_build::build();
}
