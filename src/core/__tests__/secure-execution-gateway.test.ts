import { describe, expect, it } from 'vitest';
import { SecureExecutionGateway } from '../../adapters/secure-execution-gateway';
import { AgentExecutionBoundary } from '../../adapters/agent-execution-boundary';
import { CapabilityRegistry } from '../capabilities';
import { digestApprovalParameters } from '../approval';

const sessionId = 'sess_12345678';
const capabilityId = 'cap_12345678';

function setup(risk: 'low' | 'high' = 'low') {
  const capabilities = new CapabilityRegistry();
  capabilities.add({ id: capabilityId, scope: ['tool.notify'], risk, issuedAt: 1000, expiresAt: 10000, audience: 'hui', sessionId });
  const boundary = new AgentExecutionBoundary({
    capabilities, sessionId, now: () => 1500,
    tools: [{ id: 'notify', description: 'notify', risk, capabilityScope: 'tool.notify', requiresApproval: risk === 'high' }]
  });
  const gateway = new SecureExecutionGateway({
    capabilities, sessionId, now: () => 1500,
    tools: [{ id: 'notify', description: 'notify', risk, capabilityScope: 'tool.notify', requiresApproval: risk === 'high' }],
    executors: [{ tool: 'notify', risk, sandboxed: true, execute: async args => ({ ok: true, message: args.message }) }]
  });
  return { boundary, gateway, capabilities };
}

function call(risk: 'low' | 'high' = 'low') {
  return { tool: 'notify', arguments: { message: 'hello' }, risk, capabilityId, sessionId, nonce: `nonce_${risk}_123456789012` };
}

describe('secure execution gateway', () => {
  it('executes only after final capability revalidation', async () => {
    const { boundary, gateway } = setup();
    const authorized = await boundary.authorize(call());
    if (authorized.status !== 'ready') throw new Error('expected ready');
    const result = await gateway.execute(authorized.envelope);
    expect(result.status).toBe('completed');
  });

  it('requires exact approval for high-risk execution', async () => {
    const { boundary, gateway } = setup('high');
    const authorized = await boundary.authorize(call('high'));
    if (authorized.status !== 'approval-required') throw new Error('expected approval');
    await expect(gateway.execute(authorized.envelope)).rejects.toThrow('execution_approval_required');
    const digest = await digestApprovalParameters(authorized.call.arguments);
    const result = await gateway.execute(authorized.envelope, {
      requestId: authorized.approval.id, commandId: authorized.envelope.id,
      decision: 'approved', decidedAt: 1500, parametersDigest: digest
    });
    expect(result.status).toBe('completed');
  });

  it('rejects replay', async () => {
    const { boundary, gateway } = setup();
    const authorized = await boundary.authorize(call());
    if (authorized.status !== 'ready') throw new Error('expected ready');
    await gateway.execute(authorized.envelope);
    await expect(gateway.execute(authorized.envelope)).rejects.toThrow('execution_replay');
  });

  it('rejects non-sandboxed executors', async () => {
    const { boundary, capabilities } = setup();
    const authorized = await boundary.authorize(call());
    if (authorized.status !== 'ready') throw new Error('expected ready');
    const bad = new SecureExecutionGateway({
      capabilities, sessionId,
      tools: [{ id: 'notify', description: 'notify', risk: 'low', capabilityScope: 'tool.notify' }],
      executors: [{ tool: 'notify', risk: 'low', sandboxed: false, execute: async () => null }]
    });
    await expect(bad.execute(authorized.envelope)).rejects.toThrow('executor_not_sandboxed');
  });

  it('times out long-running executors', async () => {
    const { boundary, capabilities } = setup();
    const authorized = await boundary.authorize(call());
    if (authorized.status !== 'ready') throw new Error('expected ready');
    const gateway = new SecureExecutionGateway({
      capabilities, sessionId, now: () => 1500,
      tools: [{ id: 'notify', description: 'notify', risk: 'low', capabilityScope: 'tool.notify' }],
      executors: [{ tool: 'notify', risk: 'low', sandboxed: true, execute: async (_args, ctx) => await new Promise((_, reject) => { ctx.signal.addEventListener('abort', () => reject(new Error('aborted'))); }) }],
      policy: { timeoutMs: 100 }
    });
    await expect(gateway.execute(authorized.envelope)).rejects.toThrow('execution_timeout');
  });
});
