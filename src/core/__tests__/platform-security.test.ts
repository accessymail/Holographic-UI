import { describe, expect, it } from 'vitest';
import { detectHostPlatform, platformSecurityPolicy } from '../platform-security';

describe('platform security policy', () => {
  it('requires fail-closed platform controls', () => {
    for (const platform of ['windows', 'linux', 'macos', 'unknown'] as const) {
      const policy = platformSecurityPolicy(platform);
      expect(policy.sandboxRequired).toBe(true);
      expect(policy.networkDefaultDeny).toBe(true);
      expect(policy.filesystemDefaultDeny).toBe(true);
      expect(policy.processExecutionAllowed).toBe(false);
      expect(policy.privilegeDropRequired).toBe(true);
    }
  });

  it('detects common desktop platforms', () => {
    expect(detectHostPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('windows');
    expect(detectHostPlatform('Mozilla/5.0 (X11; Linux x86_64)')).toBe('linux');
    expect(detectHostPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)')).toBe('macos');
  });
});
