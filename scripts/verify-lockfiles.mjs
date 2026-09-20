import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const checks = [];
function check(name, ok, detail) { checks.push({name, status: ok ? "PASS" : "BLOCKED", detail}); }

check("package-lock.json", existsSync(`${root}/package-lock.json`), "npm lockfile must be committed for deterministic npm ci");
check("src-tauri/Cargo.lock", existsSync(`${root}/src-tauri/Cargo.lock`), "Cargo.lock must be committed for deterministic native dependency resolution");
check(".npmrc", existsSync(`${root}/.npmrc`), "repository npm policy file present");

if (existsSync(`${root}/package-lock.json`)) {
  try {
    const lock = JSON.parse(readFileSync(`${root}/package-lock.json`, "utf8"));
    check("npm lockfile format", lock.lockfileVersion >= 3, `lockfileVersion=${lock.lockfileVersion}`);
  } catch (e) { check("npm lockfile parse", false, String(e.message)); }
}

let cargo = false;
try { execFileSync("cargo", ["--version"], {stdio:"ignore"}); cargo = true; } catch {}
check("cargo toolchain", cargo, cargo ? "cargo available" : "cargo unavailable in this environment");

const blocked = checks.filter(x => x.status === "BLOCKED");
const result = {
  schema: "holographic-ui.lockfile-verification/v1",
  generated_at: new Date().toISOString(),
  status: blocked.length ? "BLOCKED" : "PASS",
  checks
};
console.log(JSON.stringify(result, null, 2));
if (blocked.length) process.exitCode = 2;
