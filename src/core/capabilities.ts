import type { CapabilityGrant, HoloCommandType, RiskLevel } from './types';

const COMMAND_SCOPE: Record<HoloCommandType, string> = {
  CARD_OPEN: 'ui.card.open', CARD_CLOSE: 'ui.card.close', CARD_FOCUS: 'ui.card.focus',
  CARD_MINIMIZE: 'ui.card.minimize', CARD_RESTORE: 'ui.card.restore', CARD_MOVE: 'ui.card.move',
  CARD_RESIZE: 'ui.card.resize', CARD_ARRANGE: 'ui.card.arrange', CORE_STATE: 'ui.core.state',
  NOTIFY: 'ui.notify', REQUEST_APPROVAL: 'ui.approval.request', APPROVAL_DECISION: 'ui.approval.decide'
};

export class CapabilityRegistry {
  private grants = new Map<string, CapabilityGrant>();

  add(grant: CapabilityGrant): void {
    if (grant.expiresAt <= grant.issuedAt || grant.sessionId.length < 8) throw new Error('invalid_capability_grant');
    if (grant.id.length < 8 || grant.audience.trim().length < 1 || grant.scope.length === 0) throw new Error('invalid_capability_metadata');
    if (!Number.isSafeInteger(grant.issuedAt) || !Number.isSafeInteger(grant.expiresAt)) throw new Error('invalid_capability_timestamp');
    if (grant.expiresAt - grant.issuedAt > 5 * 60 * 1000) throw new Error('capability_ttl_too_long');
    this.grants.set(grant.id, Object.freeze({ ...grant, scope: [...grant.scope] }));
  }

  revoke(id: string): void { this.grants.delete(id); }
  clear(): void { this.grants.clear(); }

  allows(id: string | undefined, commandType: HoloCommandType, sessionId: string, now = Date.now()): boolean {
    if (!id) return false;
    const grant = this.grants.get(id);
    if (!grant || grant.sessionId !== sessionId || grant.expiresAt <= now) return false;
    return grant.scope.includes(COMMAND_SCOPE[commandType]) || grant.scope.includes('*');
  }

  risk(id: string | undefined): RiskLevel | undefined { return id ? this.grants.get(id)?.risk : undefined; }

  hasScope(id: string, scope: string, sessionId: string, now = Date.now()): boolean {
    const grant = this.grants.get(id);
    if (!grant || grant.sessionId !== sessionId || grant.expiresAt <= now) return false;
    return grant.scope.includes(scope) || grant.scope.includes('*');
  }
}

export function requiredScope(commandType: HoloCommandType): string { return COMMAND_SCOPE[commandType]; }
