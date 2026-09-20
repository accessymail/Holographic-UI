import { describe, expect, it } from 'vitest';
import { AgentExecutionBoundary } from '../../adapters/agent-execution-boundary';
import { CapabilityRegistry } from '../capabilities';

const sessionId = 'sess_12345678';
const capabilityId = 'cap_12345678';

function setup(risk: 'low' | 'medium' | 'high' | 'critical' = 'low') {
  const capabilities = new CapabilityRegistry();
  capabilities.add({
    id: capabilityId,
    scope: ['tool.notify'],
    risk,
    issuedAt: 1000,
    expiresAt: 5000,
    audience: 'hui',
    sessionId
  });
  const approvals: unknown[] = [];
  const boundary = new AgentExecutionBoundary({
    capabilities,
    sessionId,
    tools: [{ id: 'notify', description: 'Send a notification', risk, capabilityScope: 'tool.notify', requiresApproval: risk === 'high' }],
    now: () => 1500,
    issueApproval: request => approvals.push(request)
  });
  return { boundary, approvals };
}

const call = (overrides: Record<string, unknown> = {}) => ({
  tool: 'notify',
  arguments: { message: 'hello' },
  risk: 'low',
  capabilityId,
  sessionId,
  nonce: 'nonce_123456789012',
  ...overrides
});

describe('agent execution boundary', () => {
  it('authorizes only registered tools with the registered risk and scope', async () => {
    const { boundary } = setup();
    const result = await boundary.authorize(call());
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.envelope.tool).toBe('notify');
      expect(result.envelope.sessionId).toBe(sessionId);
    }
  });

  it('rejects unknown tools', async () => {
    const { boundary } = setup();
    await expect(boundary.authorize(call({ tool: 'shell.exec' }))).rejects.toThrow('tool_not_registered');
  });

  it('rejects model risk downgrade', async () => {
    const { boundary } = setup('high');
    await expect(boundary.authorize(call({ risk: 'low' }))).rejects.toThrow('agent_risk_mismatch');
  });

  it('requires capability scope and preserves session binding', async () => {
    const { boundary } = setup();
    await expect(boundary.authorize(call({ sessionId: 'other_12345678' }))).rejects.toThrow('agent_session_mismatch');
  });

  it('requires HITL for high risk and binds approval to parameters', async () => {
    const { boundary, approvals } = setup('high');
    const result = await boundary.authorize(call({ risk: 'high' }));
    expect(result.status).toBe('approval-required');
    expect(approvals).toHaveLength(1);
    if (result.status === 'approval-required') {
      expect(result.approval.commandId).toBe(result.envelope.id);
      expect(result.approval.parametersDigest).toBeTruthy();
    }
  });

  it('rejects replay', async () => {
    const { boundary } = setup();
    await boundary.authorize(call());
    await expect(boundary.authorize(call())).rejects.toThrow('agent_call_replay');
  });

  it('bounds arguments', async () => {
    const { boundary } = setup();
    await expect(boundary.authorize(call({ arguments: { message: 'x'.repeat(20_000) } }))).rejects.toThrow('tool_arguments_too_large');
  });
});
