import { digestApprovalParameters } from '../core/approval';
import type { CapabilityRegistry } from '../core/capabilities';
import { ReplayGuard } from '../core/security';
import type { ApprovalDecision } from '../core/approval';
import type { RiskLevel } from '../core/types';
import type { AgentExecutionEnvelope, AgentToolDefinition } from './agent-execution-boundary';

export interface ExecutionPolicy {
  timeoutMs?: number;
  maxOutputBytes?: number;
  allowNetwork?: boolean;
  allowFilesystem?: boolean;
  allowProcess?: boolean;
}

export interface ToolExecutorContext {
  signal: AbortSignal;
  sessionId: string;
  correlationId?: string;
  policy: Required<ExecutionPolicy>;
}

export interface ToolExecutor {
  readonly tool: string;
  readonly risk: RiskLevel;
  readonly sandboxed: boolean;
  execute(arguments_: Record<string, unknown>, context: ToolExecutorContext): Promise<unknown>;
}

export interface SecureExecutionGatewayOptions {
  capabilities: CapabilityRegistry;
  sessionId: string;
  tools: readonly AgentToolDefinition[];
  executors: readonly ToolExecutor[];
  now?: () => number;
  policy?: ExecutionPolicy;
  maxResultBytes?: number;
}

export interface ExecutionResult {
  status: 'completed';
  executionId: string;
  tool: string;
  sessionId: string;
  correlationId?: string;
  startedAt: number;
  completedAt: number;
  output: unknown;
}

const DEFAULT_POLICY: Required<ExecutionPolicy> = {
  timeoutMs: 10_000,
  maxOutputBytes: 64 * 1024,
  allowNetwork: false,
  allowFilesystem: false,
  allowProcess: false
};

function byteLength(value: unknown): number {
  try { return new TextEncoder().encode(JSON.stringify(value)).byteLength; }
  catch { return Number.POSITIVE_INFINITY; }
}

function isApproved(decision: ApprovalDecision | undefined, envelope: AgentExecutionEnvelope, digest: string): boolean {
  return !!decision && decision.decision === 'approved' && decision.commandId === envelope.id &&
    !!decision.parametersDigest && decision.parametersDigest === digest;
}

/**
 * Final policy gate before a host/tool executor is invoked. This class does not
 * provide shell/eval/host APIs; host integrations must supply an explicitly
 * registered executor that declares itself sandboxed and receives an AbortSignal.
 */
export class SecureExecutionGateway {
  private readonly toolMap = new Map<string, AgentToolDefinition>();
  private readonly executorMap = new Map<string, ToolExecutor>();
  private readonly replay = new ReplayGuard(5 * 60_000, 4096);
  private readonly now: () => number;
  private readonly policy: Required<ExecutionPolicy>;
  private readonly maxResultBytes: number;

  constructor(private readonly options: SecureExecutionGatewayOptions) {
    this.now = options.now ?? Date.now;
    this.policy = { ...DEFAULT_POLICY, ...(options.policy ?? {}) };
    this.policy.timeoutMs = Math.min(Math.max(this.policy.timeoutMs, 100), 60_000);
    this.policy.maxOutputBytes = Math.min(Math.max(this.policy.maxOutputBytes, 1024), 4 * 1024 * 1024);
    this.maxResultBytes = Math.min(Math.max(options.maxResultBytes ?? this.policy.maxOutputBytes, 1024), 4 * 1024 * 1024);
    for (const tool of options.tools) this.toolMap.set(tool.id, Object.freeze({ ...tool }));
    for (const executor of options.executors) {
      if (this.executorMap.has(executor.tool)) throw new Error('duplicate_tool_executor');
      this.executorMap.set(executor.tool, executor);
    }
    if (options.sessionId.length < 8) throw new Error('invalid_execution_session_id');
  }

  async execute(
    envelope: AgentExecutionEnvelope,
    approval?: ApprovalDecision
  ): Promise<ExecutionResult> {
    const now = this.now();
    this.validateEnvelope(envelope, now);

    const tool = this.toolMap.get(envelope.tool);
    if (!tool) throw new Error('tool_not_registered');
    if (tool.risk !== this.executorMap.get(tool.id)?.risk) throw new Error('executor_risk_mismatch');

    const executor = this.executorMap.get(tool.id);
    if (!executor) throw new Error('executor_not_registered');
    if (!executor.sandboxed) throw new Error('executor_not_sandboxed');
    if (envelope.approvalRequired) {
      const digest = await digestApprovalParameters(envelope.arguments);
      if (!isApproved(approval, envelope, digest)) throw new Error('execution_approval_required');
      if (approval && approval.decidedAt > now + 30_000) throw new Error('approval_not_yet_valid');
    }

    if (!this.options.capabilities.hasScope(envelope.capabilityId, tool.capabilityScope, this.options.sessionId, now)) {
      throw new Error('execution_capability_denied');
    }
    const grantedRisk = this.options.capabilities.risk(envelope.capabilityId);
    if (grantedRisk !== tool.risk) throw new Error('execution_risk_mismatch');
    if (!this.replay.accept(envelope.id, now)) throw new Error('execution_replay');

    const startedAt = now;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.policy.timeoutMs);
    try {
      const output = await executor.execute(envelope.arguments, {
        signal: controller.signal,
        sessionId: this.options.sessionId,
        correlationId: envelope.correlationId,
        policy: this.policy
      });
      if (byteLength(output) > this.maxResultBytes) throw new Error('execution_result_too_large');
      return {
        status: 'completed',
        executionId: envelope.id,
        tool: envelope.tool,
        sessionId: this.options.sessionId,
        correlationId: envelope.correlationId,
        startedAt,
        completedAt: this.now(),
        output
      };
    } catch (error) {
      if (controller.signal.aborted) throw new Error('execution_timeout');
      throw error instanceof Error ? error : new Error('execution_failed');
    } finally {
      clearTimeout(timeout);
    }
  }

  private validateEnvelope(envelope: AgentExecutionEnvelope, now: number): void {
    if (envelope.sessionId !== this.options.sessionId) throw new Error('execution_session_mismatch');
    if (envelope.createdAt > now + 30_000) throw new Error('execution_not_yet_valid');
    if (envelope.expiresAt <= now) throw new Error('execution_expired');
    if (envelope.expiresAt - envelope.createdAt > 60_000) throw new Error('execution_ttl_too_long');
    if (byteLength(envelope.arguments) > 16 * 1024) throw new Error('execution_arguments_too_large');
    if (!envelope.id || !envelope.capabilityId || !envelope.nonce) throw new Error('execution_identity_invalid');
  }
}
