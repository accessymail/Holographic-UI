import { describe, expect, it } from 'vitest';
import { CapabilityRegistry } from '../capabilities';

describe('capability registry', () => {
  it('enforces scope, audience session and expiry', () => {
    const registry = new CapabilityRegistry();
    registry.add({ id:'cap_12345678', scope:['ui.card.open'], risk:'low', issuedAt:1000, expiresAt:5000, audience:'hui', sessionId:'sess_12345678' });
    expect(registry.allows('cap_12345678', 'CARD_OPEN', 'sess_12345678', 1500)).toBe(true);
    expect(registry.allows('cap_12345678', 'CARD_CLOSE', 'sess_12345678', 1500)).toBe(false);
    expect(registry.allows('cap_12345678', 'CARD_OPEN', 'other_12345678', 1500)).toBe(false);
    expect(registry.allows('cap_12345678', 'CARD_OPEN', 'sess_12345678', 5000)).toBe(false);
  });
});
