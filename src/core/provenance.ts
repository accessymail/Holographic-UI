import type { RiskLevel } from './types';

export interface ExecutionProvenanceInput {
  executionId: string;
  tool: string;
  operation: string;
  sessionId: string;
  capabilityId: string;
  correlationId?: string;
  risk: RiskLevel;
  startedAt: number;
  completedAt: number;
  outcome: 'completed' | 'rejected' | 'error';
  reason?: string;
}

export interface ExecutionProvenanceRecord extends ExecutionProvenanceInput {
  recordId: string;
  schema: 'hui/execution-provenance/1';
  previousDigest?: string;
  digest: string;
}

function canonicalize(input: ExecutionProvenanceInput, previousDigest?: string): string {
  return JSON.stringify({ schema: 'hui/execution-provenance/1', ...input, previousDigest });
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }
  throw new Error('provenance_crypto_unavailable');
}

/** Tamper-evident, in-memory execution provenance chain. Persistence is intentionally external. */
export class ExecutionProvenanceChain {
  private readonly records: ExecutionProvenanceRecord[] = [];

  constructor(private readonly maxRecords = 1000) {}

  async append(input: ExecutionProvenanceInput): Promise<ExecutionProvenanceRecord> {
    const previousDigest = this.records.at(-1)?.digest;
    const digest = await sha256Hex(canonicalize(input, previousDigest));
    const record: ExecutionProvenanceRecord = {
      ...input,
      recordId: crypto.randomUUID(),
      schema: 'hui/execution-provenance/1',
      previousDigest,
      digest
    };
    this.records.push(record);
    while (this.records.length > this.maxRecords) this.records.shift();
    return Object.freeze(record);
  }

  snapshot(): readonly ExecutionProvenanceRecord[] { return [...this.records]; }

  async verify(): Promise<boolean> {
    let previousDigest: string | undefined;
    for (const record of this.records) {
      const { recordId: _recordId, schema: _schema, digest: stored, ...input } = record;
      if (record.previousDigest !== previousDigest) return false;
      if (await sha256Hex(canonicalize(input, previousDigest)) !== stored) return false;
      previousDigest = stored;
    }
    return true;
  }
}
