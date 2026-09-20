#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};

const MAX_PATH_BYTES: usize = 512;
const MAX_CONTENT_BYTES: usize = 256 * 1024;
const MAX_ISSUED_AGE_MS: i64 = 30_000;
const ISSUER_PUBLIC_KEY_B64: Option<&str> = option_env!("HUI_CAPABILITY_ISSUER_PUBLIC_KEY_B64");

#[derive(Debug, Deserialize)]
enum HostOperation {
    #[serde(rename = "host.ping")]
    HostPing,
    #[serde(rename = "sandbox.read_text")]
    SandboxReadText,
    #[serde(rename = "sandbox.write_text")]
    SandboxWriteText,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HostRequest {
    id: String,
    operation: HostOperation,
    session_id: String,
    capability_id: String,
    #[allow(dead_code)]
    correlation_id: Option<String>,
    path: Option<String>,
    content: Option<String>,
    nonce: String,
    sandbox_only: bool,
    issued_at: i64,
    capability_token: String,
}

mod security {
    pub mod capability;
    pub mod state;
}
use security::capability::verify_capability_token;
use security::state::NativeSecurityState;

fn operation_risk(operation: &HostOperation) -> &'static str {
    match operation {
        HostOperation::HostPing => "low",
        HostOperation::SandboxReadText => "medium",
        HostOperation::SandboxWriteText => "high",
    }
}

fn operation_name(operation: &HostOperation) -> &'static str {
    match operation {
        HostOperation::HostPing => "host.ping",
        HostOperation::SandboxReadText => "sandbox.read_text",
        HostOperation::SandboxWriteText => "sandbox.write_text",
    }
}

#[derive(Debug, Serialize)]
struct HostResponse {
    operation: &'static str,
    value: serde_json::Value,
    platform: &'static str,
    sandboxed: bool,
    process_execution_allowed: bool,
    network_default_deny: bool,
    filesystem_default_deny: bool,
    privilege_separated: bool,
    enforcement_version: &'static str,
}

fn platform_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    }
}

fn sandbox_root() -> Result<PathBuf, String> {
    let root = std::env::temp_dir().join("holographic-ui-sandbox");
    fs::create_dir_all(&root).map_err(|_| "sandbox_create_failed".to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&root, fs::Permissions::from_mode(0o700))
            .map_err(|_| "sandbox_permissions_failed".to_string())?;
    }
    Ok(root)
}

fn response(operation: &'static str, value: serde_json::Value) -> HostResponse {
    HostResponse {
        operation,
        value,
        platform: platform_name(),
        sandboxed: true,
        process_execution_allowed: false,
        network_default_deny: true,
        filesystem_default_deny: true,
        // This command never elevates privileges; OS-level privilege dropping
        // remains a deployment requirement and is not inferred from this flag.
        privilege_separated: false,
        enforcement_version: "hui/native-enforcement/1",
    }
}

fn safe_relative_path(root: &Path, raw: Option<&str>) -> Result<PathBuf, String> {
    let raw = raw.ok_or_else(|| "sandbox_path_required".to_string())?;
    if raw.is_empty() || raw.len() > MAX_PATH_BYTES || raw.starts_with('/') || raw.starts_with('\\')
    {
        return Err("sandbox_path_invalid".to_string());
    }
    let raw_path = Path::new(raw);
    for component in raw_path.components() {
        match component {
            std::path::Component::ParentDir
            | std::path::Component::RootDir
            | std::path::Component::Prefix(_) => {
                return Err("sandbox_path_invalid".to_string());
            }
            _ => {}
        }
    }
    let candidate = root.join(raw);
    let root_canonical =
        fs::canonicalize(root).map_err(|_| "sandbox_root_unavailable".to_string())?;
    if candidate.exists() {
        let canonical =
            fs::canonicalize(&candidate).map_err(|_| "sandbox_path_invalid".to_string())?;
        if !canonical.starts_with(&root_canonical) {
            return Err("sandbox_path_escape".to_string());
        }
        return Ok(canonical);
    }
    let parent = candidate
        .parent()
        .ok_or_else(|| "sandbox_path_invalid".to_string())?;
    fs::create_dir_all(parent).map_err(|_| "sandbox_parent_create_failed".to_string())?;
    let parent_canonical =
        fs::canonicalize(parent).map_err(|_| "sandbox_path_invalid".to_string())?;
    if !parent_canonical.starts_with(&root_canonical) {
        return Err("sandbox_path_escape".to_string());
    }
    Ok(candidate)
}

fn chrono_like_now_ms() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

#[tauri::command]
fn hui_native_host_execute(
    request: HostRequest,
    state: tauri::State<'_, Mutex<NativeSecurityState>>,
) -> Result<HostResponse, String> {
    if !request.sandbox_only {
        return Err("sandbox_required".to_string());
    }
    if request.id.len() < 8
        || request.session_id.len() < 8
        || request.capability_id.len() < 8
        || request.nonce.len() < 16
    {
        return Err("host_identity_invalid".to_string());
    }
    let now_ms = chrono_like_now_ms();
    if request.issued_at <= 0 || now_ms.saturating_sub(request.issued_at).abs() > MAX_ISSUED_AGE_MS
    {
        return Err("host_request_expired".to_string());
    }
    let issuer_key = ISSUER_PUBLIC_KEY_B64.ok_or("capability_issuer_key_unconfigured")?;
    verify_capability_token(
        &request.capability_token,
        &request.capability_id,
        &request.session_id,
        operation_name(&request.operation),
        operation_risk(&request.operation),
        &request.nonce,
        now_ms,
        issuer_key,
    )
    .map_err(str::to_string)?;
    state
        .lock()
        .map_err(|_| "native_security_state_unavailable")?
        .admit(&request.nonce, now_ms)?;
    let root = sandbox_root()?;

    match request.operation {
        HostOperation::HostPing => Ok(response(
            "host.ping",
            serde_json::json!({"sandboxed": true}),
        )),
        HostOperation::SandboxReadText => {
            let path = safe_relative_path(&root, request.path.as_deref())?;
            let metadata = fs::metadata(&path).map_err(|_| "sandbox_read_failed".to_string())?;
            if metadata.len() > MAX_CONTENT_BYTES as u64 {
                return Err("sandbox_file_too_large".to_string());
            }
            let content =
                fs::read_to_string(path).map_err(|_| "sandbox_read_failed".to_string())?;
            Ok(response(
                "sandbox.read_text",
                serde_json::json!({"content": content}),
            ))
        }
        HostOperation::SandboxWriteText => {
            let content = request
                .content
                .ok_or_else(|| "sandbox_content_required".to_string())?;
            if content.len() > MAX_CONTENT_BYTES {
                return Err("sandbox_content_too_large".to_string());
            }
            let path = safe_relative_path(&root, request.path.as_deref())?;
            fs::write(path, content).map_err(|_| "sandbox_write_failed".to_string())?;
            Ok(response(
                "sandbox.write_text",
                serde_json::json!({"written": true}),
            ))
        }
    }
}

fn main() {
    tauri::Builder::default()
        .manage(Mutex::new(NativeSecurityState::new()))
        .invoke_handler(tauri::generate_handler![hui_native_host_execute])
        .run(tauri::generate_context!())
        .expect("error while running Holographic UI");
}
