import { describe, expect, it } from 'vitest';
import { digestApprovalParameters, validateApprovalRequest } from '../approval';

describe('approval protocol', () => {
  it('rejects expired requests', () => {
    expect(() => validateApprovalRequest({ id: 'approval01', commandId: 'command01', title: 'Approve', description: 'Test', risk: 'low', createdAt: 10, expiresAt: 20 }, 21)).toThrow('approval_expired');
  });

  it('creates a deterministic parameter digest', async () => {
    const a = await digestApprovalParameters({ b: 2, a: 1 });
    const b = await digestApprovalParameters({ b: 2, a: 1 });
    expect(a).toBe(b);
  });
});
