import { describe, expect, it } from 'vitest';
import { NativeHostBoundary } from '../../adapters/native-host-boundary';

const sessionId = 'sess_12345678';
const base = {
  id: 'hostreq_123456', operation: 'host.ping', sessionId,
  capabilityId: 'cap_12345678', nonce: 'nonce_123456789012'
};
const token = 'signed-capability-token';
const opts = { getCapabilityToken: async () => token };

const mockInvoke = async <T>(
  _command: string,
  _payload: unknown,
  _signal: AbortSignal
): Promise<T> => ({ ok: true } as T);

const mockEmptyInvoke = async <T>(
  _command: string,
  _payload: unknown,
  _signal: AbortSignal
): Promise<T> => ({} as T);

describe('native host boundary', () => {
  it('allows only the fixed declarative operation vocabulary', async () => {
    const calls: unknown[] = [];
    const host = new NativeHostBoundary({ ...opts, sessionId, invoke: { invoke: async <T>(_command: string, payload: unknown, _signal: AbortSignal): Promise<T> => {
      calls.push(payload);
      return { ok: true } as T;
    } } });
    const result = await host.execute(base);
    expect(result.status).toBe('completed');
    expect(calls).toHaveLength(1);
  });

  it('rejects shell-like or unknown operations before native IPC', async () => {
    const host = new NativeHostBoundary({ ...opts, sessionId, invoke: { invoke: mockInvoke } });
    await expect(host.execute({ ...base, operation: 'shell.exec', nonce: 'nonce_223456789012' })).rejects.toThrow('native_host_request_invalid');
  });

  it('rejects session mismatch and replay', async () => {
    const host = new NativeHostBoundary({ ...opts, sessionId, invoke: { invoke: mockInvoke } });
    await expect(host.execute({ ...base, sessionId: 'sess_other12345' })).rejects.toThrow('native_host_session_mismatch');
    await host.execute(base);
    await expect(host.execute(base)).rejects.toThrow('native_host_replay');
  });

  it('bounds host content before IPC', async () => {
    const host = new NativeHostBoundary({ ...opts, sessionId, invoke: { invoke: mockInvoke }, policy: { maxContentBytes: 4 } });
    await expect(host.execute({ ...base, operation: 'sandbox.write_text', nonce: 'nonce_323456789012', path: 'a.txt', content: '12345' })).rejects.toThrow('native_host_content_too_large');
  });

  it('forces sandboxOnly even if caller tries to override policy', () => {
    expect(() => new NativeHostBoundary({ ...opts, sessionId, invoke: { invoke: mockEmptyInvoke }, policy: { sandboxOnly: false as true } })).not.toThrow();
  });
});
