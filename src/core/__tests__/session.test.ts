import { describe, expect, it } from 'vitest';
import { SessionManager } from '../session';

describe('SessionManager', () => {
  it('rejects capability grants before authentication', () => {
    const manager = new SessionManager();
    const session = manager.start(1000);
    expect(() => manager.grant({ id: 'capability01', scope: ['ui.card.open'], risk: 'low', issuedAt: 1000, expiresAt: 5000, audience: 'hui', sessionId: session.id }, 2000)).toThrow('session_not_authenticated');
  });

  it('binds valid capabilities to the authenticated session', () => {
    const manager = new SessionManager();
    const session = manager.start(1000);
    manager.authenticate();
    manager.grant({ id: 'capability01', scope: ['ui.card.open'], risk: 'low', issuedAt: 1000, expiresAt: 5000, audience: 'hui', sessionId: session.id }, 2000);
    expect(manager.capabilities.allows('capability01', 'CARD_OPEN', session.id, 2000)).toBe(true);
    expect(manager.capabilities.allows('capability01', 'CARD_OPEN', session.id, 6000)).toBe(false);
  });

  it('rejects expired or future capability grants', () => {
    const manager = new SessionManager();
    const session = manager.start(1000);
    manager.authenticate();
    expect(() => manager.grant({ id: 'expired01', scope: ['ui.card.open'], risk: 'low', issuedAt: 1000, expiresAt: 1500, audience: 'hui', sessionId: session.id }, 2000)).toThrow('capability_expired');
    expect(() => manager.grant({ id: 'future001', scope: ['ui.card.open'], risk: 'low', issuedAt: 50000, expiresAt: 54000, audience: 'hui', sessionId: session.id }, 2000)).toThrow('capability_not_yet_valid');
  });
});
