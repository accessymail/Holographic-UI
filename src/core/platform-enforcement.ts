export type EnforcedPlatform = 'windows' | 'linux' | 'macos' | 'unknown';

export interface NativePlatformAttestation {
  platform: EnforcedPlatform;
  sandboxed: boolean;
  process_execution_allowed: boolean;
  network_default_deny: boolean;
  filesystem_default_deny: boolean;
  privilege_separated: boolean;
  enforcement_version: 'hui/native-enforcement/1';
}

export interface PlatformEnforcementPolicy {
  expectedPlatform?: EnforcedPlatform;
  requireSandbox: boolean;
  requireProcessDeny: boolean;
  requireNetworkDeny: boolean;
  requireFilesystemDeny: boolean;
  requirePrivilegeSeparation: boolean;
}

const DEFAULT_POLICY: PlatformEnforcementPolicy = {
  requireSandbox: true,
  requireProcessDeny: true,
  requireNetworkDeny: true,
  requireFilesystemDeny: true,
  requirePrivilegeSeparation: true
};

/**
 * Validates claims returned by the native boundary. This is a gate, not proof
 * of OS isolation: platform-level enforcement must still be verified natively.
 */
export function validateNativePlatformAttestation(
  value: unknown,
  policy: Partial<PlatformEnforcementPolicy> = {}
): NativePlatformAttestation {
  const effective = { ...DEFAULT_POLICY, ...policy };
  if (!value || typeof value !== 'object') throw new Error('platform_attestation_invalid');
  const att = value as Partial<NativePlatformAttestation>;
  if (att.enforcement_version !== 'hui/native-enforcement/1') throw new Error('platform_enforcement_version_invalid');
  if (!['windows', 'linux', 'macos', 'unknown'].includes(att.platform ?? '')) throw new Error('platform_attestation_platform_invalid');
  if (effective.expectedPlatform && att.platform !== effective.expectedPlatform) throw new Error('platform_mismatch');
  if (effective.requireSandbox && att.sandboxed !== true) throw new Error('platform_sandbox_required');
  if (effective.requireProcessDeny && att.process_execution_allowed !== false) throw new Error('platform_process_execution_not_denied');
  if (effective.requireNetworkDeny && att.network_default_deny !== true) throw new Error('platform_network_not_denied');
  if (effective.requireFilesystemDeny && att.filesystem_default_deny !== true) throw new Error('platform_filesystem_not_denied');
  if (effective.requirePrivilegeSeparation && att.privilege_separated !== true) throw new Error('platform_privilege_separation_required');
  return Object.freeze(att as NativePlatformAttestation);
}
