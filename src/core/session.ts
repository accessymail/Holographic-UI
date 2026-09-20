import type { CapabilityGrant } from './types';
import { CapabilityRegistry } from './capabilities';
import { randomNonce } from './secure-utils';

export interface SessionState {
  id: string;
  nonce: string;
  establishedAt: number;
  authenticated: boolean;
  capabilities: readonly string[];
}

export class SessionManager {
  readonly capabilities = new CapabilityRegistry();
  private current: SessionState | null = null;

  start(now = Date.now()): SessionState {
    this.capabilities.clear();
    this.current = {
      id: crypto.randomUUID(),
      nonce: randomNonce(24),
      establishedAt: now,
      authenticated: false,
      capabilities: []
    };
    return this.current;
  }

  authenticate(): void {
    if (!this.current) throw new Error('session_not_started');
    this.current = { ...this.current, authenticated: true };
  }

  grant(grant: CapabilityGrant, now = Date.now()): void {
    if (!this.current || !this.current.authenticated) throw new Error('session_not_authenticated');
    if (grant.sessionId !== this.current.id) throw new Error('capability_session_mismatch');
    if (!Number.isSafeInteger(grant.issuedAt) || grant.issuedAt > now + 30_000) throw new Error('capability_not_yet_valid');
    if (grant.expiresAt <= now) throw new Error('capability_expired');
    this.capabilities.add(grant);
    this.current = { ...this.current, capabilities: [...this.current.capabilities, grant.id] };
  }

  get state(): SessionState | null { return this.current; }

  end(): void {
    this.capabilities.clear();
    this.current = null;
  }
}
