import type { HoloCommand, HoloCommandType, HoloEvent, SecurityPolicy } from './types';
import { validateCommandPayload } from './protocol';
import { RateLimiter } from './rate-limit';
import { utf8ByteLength } from './secure-utils';

export type SecurityCheckResult = { ok: true } | { ok: false; reason: string };

const UI_COMMANDS: HoloCommandType[] = [
  'CARD_OPEN', 'CARD_CLOSE', 'CARD_FOCUS', 'CARD_MINIMIZE', 'CARD_RESTORE',
  'CARD_MOVE', 'CARD_RESIZE', 'CARD_ARRANGE', 'CORE_STATE', 'NOTIFY', 'REQUEST_APPROVAL', 'APPROVAL_DECISION'
];

export const DEFAULT_POLICY: SecurityPolicy = {
  allowedCommandTypes: new Set<HoloCommandType>(UI_COMMANDS),
  requireApprovalFor: new Set<HoloCommandType>(['REQUEST_APPROVAL']),
  maxCommandTtlMs: 15_000,
  allowedEventOrigins: [typeof window !== 'undefined' ? window.location.origin : 'null'],
  maxPayloadBytes: 256 * 1024,
  maxInboundEventsPerSecond: 60,
  clockSkewMs: 30_000
};

export class ReplayGuard {
  private readonly seen = new Map<string, number>();
  constructor(private readonly ttlMs = 60_000, private readonly maxEntries = 4096) {}

  accept(id: string, now = Date.now()): boolean {
    for (const [key, expires] of this.seen) if (expires <= now) this.seen.delete(key);
    if (this.seen.has(id)) return false;
    this.seen.set(id, now + this.ttlMs);
    if (this.seen.size > this.maxEntries) this.seen.delete(this.seen.keys().next().value as string);
    return true;
  }

  clear(): void { this.seen.clear(); }
}

export class SecurityPolicyClient {
  private readonly replay = new ReplayGuard();
  private readonly inboundLimiter: RateLimiter;
  constructor(private readonly policy: SecurityPolicy = DEFAULT_POLICY) {
    this.inboundLimiter = new RateLimiter(policy.maxInboundEventsPerSecond);
  }

  validateCommand(command: HoloCommand, now = Date.now()): SecurityCheckResult {
    if (!this.policy.allowedCommandTypes.has(command.type)) return { ok: false, reason: 'command_not_allowed' };
    if (command.protocol !== 'hui/1.0') return { ok: false, reason: 'protocol_mismatch' };
    if (!/^[A-Za-z0-9._:-]{8,160}$/.test(command.id)) return { ok: false, reason: 'invalid_id' };
    if (!command.source || !command.authority) return { ok: false, reason: 'invalid_envelope' };
    if ((command.source === 'user' || command.source === 'gesture') && command.authority !== 'ui') return { ok: false, reason: 'invalid_authority' };
    if (command.source === 'ai' && command.authority !== 'session') return { ok: false, reason: 'ai_authority_required' };
    if ((command.source === 'ai' || command.source === 'backend') && !command.capabilityId) return { ok: false, reason: 'capability_required' };
    if (utf8ByteLength(command.payload) > this.policy.maxPayloadBytes) return { ok: false, reason: 'payload_too_large' };
    if (!validateCommandPayload(command)) return { ok: false, reason: 'invalid_payload' };
    if (!Number.isSafeInteger(command.createdAt) || !Number.isSafeInteger(command.expiresAt)) return { ok: false, reason: 'invalid_timestamp' };
    if (command.createdAt > now + this.policy.clockSkewMs) return { ok: false, reason: 'future_timestamp' };
    if (command.expiresAt <= now) return { ok: false, reason: 'expired' };
    if (command.expiresAt <= command.createdAt) return { ok: false, reason: 'invalid_expiry' };
    if (this.policy.requireApprovalFor.has(command.type) && command.approvalRequired !== true) return { ok: false, reason: 'approval_required' };
    if (command.nonce && !this.replay.accept(command.nonce, now)) return { ok: false, reason: 'replay_detected' };
    return { ok: true };
  }

  validateEvent(event: HoloEvent, now = Date.now()): SecurityCheckResult {
    if (event.protocol !== 'hui/1.0') return { ok: false, reason: 'protocol_mismatch' };
    if (!/^[A-Za-z0-9._:-]{8,160}$/.test(event.id)) return { ok: false, reason: 'invalid_id' };
    if (!Number.isSafeInteger(event.timestamp) || event.timestamp <= 0) return { ok: false, reason: 'invalid_timestamp' };
    if (Math.abs(now - event.timestamp) > this.policy.clockSkewMs * 4) return { ok: false, reason: 'stale_event' };
    if (!this.inboundLimiter.accept(now)) return { ok: false, reason: 'inbound_rate_limited' };
    if (utf8ByteLength(event.payload) > this.policy.maxPayloadBytes) return { ok: false, reason: 'payload_too_large' };
    if (event.nonce && !this.replay.accept(event.nonce, now)) return { ok: false, reason: 'replay_detected' };
    return { ok: true };
  }

  resetSession(): void { this.replay.clear(); this.inboundLimiter.reset(); }
}

export function isSecureTransport(url: string, allowInsecureLocalhost = false): boolean {
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
    if (parsed.protocol === 'wss:') return true;
    return allowInsecureLocalhost && parsed.protocol === 'ws:' && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  } catch { return false; }
}
