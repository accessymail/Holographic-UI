import { z } from 'zod';
import { digestApprovalParameters } from '../core/approval';
import type { CapabilityRegistry } from '../core/capabilities';
import { ReplayGuard } from '../core/security';
import type { ApprovalRequest, RiskLevel } from '../core/types';

const SAFE_ID = z.string().regex(/^[A-Za-z0-9._:-]{8,160}$/);
const TOOL_ID = z.string().regex(/^[a-zA-Z0-9._:-]{1,128}$/);
const riskSchema = z.enum(['low', 'medium', 'high', 'critical']);

export const agentToolCallSchema = z.object({
  tool: TOOL_ID,
  arguments: z.record(z.string(), z.unknown()).default({}),
  risk: riskSchema,
  capabilityId: SAFE_ID,
  sessionId: SAFE_ID,
  correlationId: SAFE_ID.optional(),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/)
}).strict();

export type AgentToolCall = z.infer<typeof agentToolCallSchema>;

export interface AgentToolDefinition {
  id: string;
  description: string;
  risk: RiskLevel;
  capabilityScope: string;
  requiresApproval?: boolean;
  maxArgumentBytes?: number;
}

export interface AgentExecutionBoundaryOptions {
  capabilities: CapabilityRegistry;
  sessionId: string;
  tools: readonly AgentToolDefinition[];
  now?: () => number;
  maxCallBytes?: number;
  approvalTtlMs?: number;
  issueApproval?: (request: ApprovalRequest) => void;
}

export interface AgentExecutionEnvelope {
  id: string;
  tool: string;
  arguments: Record<string, unknown>;
  capabilityId: string;
  sessionId: string;
  correlationId?: string;
  createdAt: number;
  expiresAt: number;
  approvalRequired: boolean;
  nonce: string;
}

export type AgentExecutionResult =
  | { status: 'ready'; call: AgentToolCall; tool: AgentToolDefinition; envelope: AgentExecutionEnvelope }
  | { status: 'approval-required'; call: AgentToolCall; tool: AgentToolDefinition; approval: ApprovalRequest; envelope: AgentExecutionEnvelope };

/**
 * Agent/tool output is untrusted. This boundary only validates and authorizes a
 * registered tool call; it does not execute arbitrary functions or expose a
 * generic eval/command surface.
 */
export class AgentExecutionBoundary {
  private readonly toolMap = new Map<string, AgentToolDefinition>();
  private readonly replay = new ReplayGuard(60_000, 4096);
  private readonly now: () => number;
  private readonly maxCallBytes: number;
  private readonly approvalTtlMs: number;

  constructor(private readonly options: AgentExecutionBoundaryOptions) {
    this.now = options.now ?? Date.now;
    this.maxCallBytes = options.maxCallBytes ?? 32 * 1024;
    this.approvalTtlMs = Math.min(Math.max(options.approvalTtlMs ?? 60_000, 5_000), 5 * 60_000);
    if (!SAFE_ID.safeParse(options.sessionId).success) throw new Error('invalid_agent_session_id');
    for (const tool of options.tools) {
      if (!TOOL_ID.safeParse(tool.id).success || !tool.capabilityScope.trim()) throw new Error('invalid_tool_definition');
      if (this.toolMap.has(tool.id)) throw new Error('duplicate_tool_definition');
      this.toolMap.set(tool.id, Object.freeze({ ...tool }));
    }
  }

  parse(value: unknown): AgentToolCall {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error('agent_call_invalid');
    if (new TextEncoder().encode(encoded).byteLength > this.maxCallBytes) throw new Error('agent_call_too_large');
    const result = agentToolCallSchema.safeParse(value);
    if (!result.success) throw new Error('agent_call_invalid');
    return result.data;
  }

  async authorize(value: unknown): Promise<AgentExecutionResult> {
    const call = this.parse(value);
    const now = this.now();
    if (call.sessionId !== this.options.sessionId) throw new Error('agent_session_mismatch');
    if (!this.replay.accept(call.nonce, now)) throw new Error('agent_call_replay');

    const tool = this.toolMap.get(call.tool);
    if (!tool) throw new Error('tool_not_registered');
    if (call.risk !== tool.risk) throw new Error('agent_risk_mismatch');
    const grantRisk = this.options.capabilities.risk(call.capabilityId);
    if (!grantRisk || grantRisk !== tool.risk) throw new Error('capability_denied');
    if (!this.options.capabilities.hasScope(call.capabilityId, tool.capabilityScope, this.options.sessionId, now)) {
      throw new Error('tool_capability_denied');
    }

    const argumentBytes = new TextEncoder().encode(JSON.stringify(call.arguments)).byteLength;
    if (argumentBytes > (tool.maxArgumentBytes ?? 16 * 1024)) throw new Error('tool_arguments_too_large');

    const approvalRequired = tool.requiresApproval === true || call.risk === 'high' || call.risk === 'critical';
    const envelope = this.createExecutionEnvelope(call, tool, now, approvalRequired);
    if (!approvalRequired) return { status: 'ready', call, tool, envelope };

    const approval: ApprovalRequest = {
      id: crypto.randomUUID(),
      commandId: envelope.id,
      title: `Approve agent tool: ${tool.id}`,
      description: tool.description,
      risk: tool.risk,
      capabilityId: call.capabilityId,
      createdAt: now,
      expiresAt: Math.min(envelope.expiresAt, now + this.approvalTtlMs),
      parametersDigest: await digestApprovalParameters(call.arguments)
    };
    this.options.issueApproval?.(approval);
    return { status: 'approval-required', call, tool, approval, envelope };
  }

  private createExecutionEnvelope(call: AgentToolCall, tool: AgentToolDefinition, now: number, approvalRequired: boolean): AgentExecutionEnvelope {
    return {
      id: crypto.randomUUID(),
      tool: tool.id,
      arguments: call.arguments,
      capabilityId: call.capabilityId,
      sessionId: this.options.sessionId,
      correlationId: call.correlationId,
      createdAt: now,
      expiresAt: now + 10_000,
      approvalRequired,
      nonce: crypto.randomUUID().replace(/-/g, '')
    };
  }
}
