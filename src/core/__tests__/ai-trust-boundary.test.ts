import { describe, expect, it } from 'vitest';
import { AiTrustBoundary } from '../../adapters/ai-trust-boundary';
import { CapabilityRegistry } from '../capabilities';

const sessionId = 'sess_12345678';
const capabilityId = 'cap_12345678';

function setup(risk: 'low' | 'medium' | 'high' | 'critical' = 'low') {
  const capabilities = new CapabilityRegistry();
  capabilities.add({
    id: capabilityId,
    scope: ['ui.card.focus', 'ui.notify'],
    risk,
    issuedAt: 1000,
    expiresAt: 5000,
    audience: 'hui',
    sessionId
  });
  return { capabilities, boundary: new AiTrustBoundary({ capabilities, sessionId, now: () => 1500 }) };
}

const proposal = (overrides: Record<string, unknown> = {}) => ({
  type: 'CARD_FOCUS',
  payload: { id: 'card_1' },
  risk: 'low',
  approvalRequired: false,
  capabilityId,
  sessionId,
  nonce: 'nonce_123456789012',
  ...overrides
});

describe('AI trust boundary', () => {
  it('creates only an authorized AI UI command', () => {
    const { boundary } = setup();
    const command = boundary.authorize(proposal());
    expect(command.source).toBe('ai');
    expect(command.authority).toBe('session');
    expect(command.capabilityId).toBe(capabilityId);
    expect(command.sessionId).toBe(sessionId);
  });

  it('rejects arbitrary/unknown AI actions', () => {
    const { boundary } = setup();
    expect(() => boundary.authorize(proposal({ type: 'EXECUTE_PROCESS' }))).toThrow('ai_proposal_invalid');
  });

  it('rejects a session mismatch', () => {
    const { boundary } = setup();
    expect(() => boundary.authorize(proposal({ sessionId: 'other_12345678' }))).toThrow('ai_session_mismatch');
  });

  it('rejects missing or wrong capability scope', () => {
    const { capabilities, boundary } = setup();
    capabilities.revoke(capabilityId);
    expect(() => boundary.authorize(proposal())).toThrow('capability_denied');
  });

  it('rejects a risk downgrade supplied by the model', () => {
    const { boundary } = setup('high');
    expect(() => boundary.authorize(proposal({ risk: 'low' }))).toThrow('ai_risk_mismatch');
  });

  it('requires approval for high-risk capability grants', () => {
    const { boundary } = setup('high');
    const command = boundary.authorize(proposal({ risk: 'high' }));
    expect(command.approvalRequired).toBe(true);
  });

  it('rejects replayed AI proposals', () => {
    const { boundary } = setup();
    boundary.authorize(proposal());
    expect(() => boundary.authorize(proposal())).toThrow('ai_proposal_replay');
  });

  it('rejects malformed payloads before command creation', () => {
    const { boundary } = setup();
    expect(() => boundary.authorize(proposal({ payload: { id: 'card_1', extra: 'nope' } }))).toThrow('ai_action_payload_invalid');
  });
});
