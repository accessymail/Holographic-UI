export type HostPlatform = 'windows' | 'linux' | 'macos' | 'unknown';

export interface PlatformSecurityPolicy {
  platform: HostPlatform;
  sandboxRequired: boolean;
  networkDefaultDeny: boolean;
  filesystemDefaultDeny: boolean;
  processExecutionAllowed: boolean;
  privilegeDropRequired: boolean;
}

export function detectHostPlatform(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''): HostPlatform {
  if (/Windows/i.test(userAgent)) return 'windows';
  if (/Macintosh|Mac OS X/i.test(userAgent)) return 'macos';
  if (/Linux/i.test(userAgent)) return 'linux';
  return 'unknown';
}

/** Declarative qualification policy. Native code remains responsible for OS enforcement. */
export function platformSecurityPolicy(platform: HostPlatform): PlatformSecurityPolicy {
  return {
    platform,
    sandboxRequired: true,
    networkDefaultDeny: true,
    filesystemDefaultDeny: true,
    processExecutionAllowed: false,
    privilegeDropRequired: true
  };
}
