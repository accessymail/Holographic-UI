import { describe, expect, it } from 'vitest';
import { safeParseCommand } from '../protocol';

describe('protocol', () => {
  it('parses valid command envelopes', () => {
    const result = safeParseCommand({ protocol:'hui/1.0', id:'12345678', type:'NOTIFY', payload:{message:'ok'}, source:'user', authority:'ui', createdAt:1, expiresAt:2 });
    expect(result.success).toBe(true);
  });
  it('rejects unknown fields', () => {
    const result = safeParseCommand({ protocol:'hui/1.0', id:'12345678', type:'NOTIFY', payload:{}, source:'user', authority:'ui', createdAt:1, expiresAt:2, secret:'no' });
    expect(result.success).toBe(false);
  });
});
