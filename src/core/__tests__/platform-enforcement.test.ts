import { describe, expect, it } from 'vitest';
import { validateNativePlatformAttestation } from '../platform-enforcement';

const base = {
  platform: 'linux', sandboxed: true, process_execution_allowed: false,
  network_default_deny: true, filesystem_default_deny: true,
  privilege_separated: true, enforcement_version: 'hui/native-enforcement/1' as const
};

describe('platform enforcement', () => {
  it('accepts a fully constrained native attestation', () => {
    expect(validateNativePlatformAttestation(base, { expectedPlatform: 'linux' }).platform).toBe('linux');
  });
  it('fails closed when sandbox enforcement is missing', () => {
    expect(() => validateNativePlatformAttestation({ ...base, sandboxed: false })).toThrow('platform_sandbox_required');
  });
  it('rejects platform mismatch and privilege gaps', () => {
    expect(() => validateNativePlatformAttestation(base, { expectedPlatform: 'windows' })).toThrow('platform_mismatch');
    expect(() => validateNativePlatformAttestation({ ...base, privilege_separated: false })).toThrow('platform_privilege_separation_required');
  });
});
