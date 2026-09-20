import { z } from 'zod';
import type { RiskLevel } from '../core/types';

const HOST_ID = z.string().regex(/^[A-Za-z0-9._:-]{8,160}$/);
const hostOperationSchema = z.enum(['sandbox.read_text', 'sandbox.write_text', 'host.ping']);

export const nativeHostRequestSchema = z.object({
  id: HOST_ID,
  operation: hostOperationSchema,
  sessionId: HOST_ID,
  capabilityId: HOST_ID,
  correlationId: HOST_ID.optional(),
  path: z.string().max(512).optional(),
  content: z.string().max(256 * 1024).optional(),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/)
}).strict();

export type NativeHostRequest = z.infer<typeof nativeHostRequestSchema>;

export interface NativeHostPolicy {
  allowedOperations: readonly NativeHostRequest['operation'][];
  maxContentBytes: number;
  maxPathLength: number;
  sandboxOnly: true;
  maxRequestsPerMinute: number;
  maxExecutionMs: number;
}

export interface NativeHostInvoker {
  invoke<T>(command: string, payload: unknown, signal: AbortSignal): Promise<T>;
}

export interface NativeHostBoundaryOptions {
  sessionId: string;
  invoke: NativeHostInvoker;
  now?: () => number;
  policy?: Partial<NativeHostPolicy>;
  /** Returns a short-lived, signed capability token issued by the trusted authorization plane. */
  getCapabilityToken: (request: NativeHostRequest) => Promise<string>;
}

export interface NativeHostResult {
  status: 'completed';
  operation: NativeHostRequest['operation'];
  sessionId: string;
  value: unknown;
}

const DEFAULT_POLICY: NativeHostPolicy = {
  allowedOperations: ['host.ping', 'sandbox.read_text', 'sandbox.write_text'],
  maxContentBytes: 256 * 1024,
  maxPathLength: 512,
  sandboxOnly: true,
  maxRequestsPerMinute: 120,
  maxExecutionMs: 10_000
};

/**
 * Browser-side boundary for the native host adapter. It deliberately accepts
 * only a tiny declarative operation vocabulary and delegates enforcement to a
 * native implementation. It never accepts a shell command, executable path,
 * arbitrary IPC channel, or dynamic host method name.
 */
export class NativeHostBoundary {
  private readonly policy: NativeHostPolicy;
  private readonly now: () => number;
  private readonly seen = new Set<string>();
  private readonly requestTimes: number[] = [];

  constructor(private readonly options: NativeHostBoundaryOptions) {
    if (!HOST_ID.safeParse(options.sessionId).success) throw new Error('invalid_host_session_id');
    this.now = options.now ?? Date.now;
    this.policy = { ...DEFAULT_POLICY, ...(options.policy ?? {}), sandboxOnly: true };
  }

  async execute(value: unknown, signal = new AbortController().signal): Promise<NativeHostResult> {
    const request = nativeHostRequestSchema.safeParse(value);
    if (!request.success) throw new Error('native_host_request_invalid');
    const req = request.data;
    if (req.sessionId !== this.options.sessionId) throw new Error('native_host_session_mismatch');
    if (this.seen.has(req.nonce)) throw new Error('native_host_replay');
    this.seen.add(req.nonce);
    const cutoff = this.now() - 60_000;
    while (this.requestTimes[0] !== undefined && this.requestTimes[0] <= cutoff) this.requestTimes.shift();
    if (this.requestTimes.length >= this.policy.maxRequestsPerMinute) throw new Error('native_host_rate_limited');
    this.requestTimes.push(this.now());
    if (!this.policy.allowedOperations.includes(req.operation)) throw new Error('native_host_operation_denied');
    if (req.path && req.path.length > this.policy.maxPathLength) throw new Error('native_host_path_too_long');
    if (req.content !== undefined && new TextEncoder().encode(req.content).byteLength > this.policy.maxContentBytes) {
      throw new Error('native_host_content_too_large');
    }
    if (signal.aborted) throw new Error('native_host_cancelled');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.policy.maxExecutionMs);
    const effectiveSignal = signal.aborted ? signal : controller.signal;
    if (signal.aborted) { clearTimeout(timeout); throw new Error('native_host_cancelled'); }
    try {
    const capabilityToken = await this.options.getCapabilityToken(req);
    if (!capabilityToken || capabilityToken.length > 16 * 1024) throw new Error('native_host_capability_token_invalid');
    const value = await this.options.invoke.invoke('hui_native_host_execute', {
      ...req,
      issuedAt: this.now(),
      sandboxOnly: true,
      capabilityToken
    }, effectiveSignal);
    if (effectiveSignal.aborted) throw new Error('native_host_timeout');
    return { status: 'completed', operation: req.operation, sessionId: req.sessionId, value };
    } finally { clearTimeout(timeout); }
  }
}

/** Maps execution risk to the minimum native-host boundary required by policy. */
export function nativeHostRisk(operation: NativeHostRequest['operation']): RiskLevel {
  switch (operation) {
    case 'host.ping': return 'low';
    case 'sandbox.read_text': return 'medium';
    case 'sandbox.write_text': return 'high';
    default: {
      const exhaustive: never = operation;
      throw new Error(`native_host_unknown_operation:${exhaustive}`);
    }
  }
}
