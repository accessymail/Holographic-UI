import { describe, expect, it } from 'vitest';
import { CommandRouter } from '../command-router';
import { SecurityPolicyClient } from '../security';
import type { HoloCommand } from '../types';

const base = (overrides: Partial<HoloCommand> = {}): HoloCommand => ({
  protocol:'hui/1.0', id:'12345678-test', type:'CORE_STATE', payload:{state:'thinking'}, source:'user', authority:'ui', createdAt:1000, expiresAt:5000, ...overrides
});

describe('CommandRouter security', () => {
  it('accepts a valid short-lived command', () => expect(new CommandRouter().validate(base(), 1500)).toEqual({ok:true}));
  it('rejects expired commands', () => expect(new CommandRouter().validate(base({expiresAt: 1200}), 1500)).toEqual({ok:false, reason:'expired'}));
  it('rejects protocol mismatches', () => expect(new CommandRouter().validate(base({protocol:'wrong' as 'hui/1.0'}), 1500)).toEqual({ok:false, reason:'protocol_mismatch'}));
  it('rejects oversized payloads', () => expect(new SecurityPolicyClient().validateCommand(base({payload:'x'.repeat(300_000)}), 1500)).toEqual({ok:false, reason:'payload_too_large'}));
  it('rejects replayed nonces', () => {
    const security = new SecurityPolicyClient();
    const command = base({nonce:'abcdefghijklmnop'});
    expect(security.validateCommand(command, 1500)).toEqual({ok:true});
    expect(security.validateCommand({...command, id:'12345678-other'}, 1501)).toEqual({ok:false, reason:'replay_detected'});
  });
  it('requires capabilities for AI/backend-originated commands', () => {
    const security = new SecurityPolicyClient();
    expect(security.validateCommand(base({source:'ai', authority:'session'}), 1500)).toEqual({ok:false, reason:'capability_required'});
    expect(security.validateCommand(base({source:'backend', authority:'session'}), 1500)).toEqual({ok:false, reason:'capability_required'});
  });
  it('propagates capability IDs when creating AI commands', () => {
    const command = new CommandRouter().create('CORE_STATE', {state:'thinking'}, 'ai', 'session', { capabilityId:'capability01', sessionId:'session01' });
    expect(command.capabilityId).toBe('capability01');
    expect(command.sessionId).toBe('session01');
  });
});
