import { z } from 'zod';
import { CommandRouter } from '../core/command-router';
import type { CapabilityRegistry } from '../core/capabilities';
import { requiredScope } from '../core/capabilities';
import { ReplayGuard } from '../core/security';
import type { HoloCommand, RiskLevel } from '../core/types';

const CARD_ID = z.string().regex(/^[a-zA-Z0-9._:-]{1,128}$/);

const actionSchemas = {
  CARD_OPEN: z.object({ id: CARD_ID }).strict(),
  CARD_CLOSE: z.object({ id: CARD_ID }).strict(),
  CARD_FOCUS: z.object({ id: CARD_ID }).strict(),
  CARD_MINIMIZE: z.object({ id: CARD_ID }).strict(),
  CARD_RESTORE: z.object({ id: CARD_ID }).strict(),
  CARD_MOVE: z.object({ id: CARD_ID, x: z.number().finite().min(-10).max(110), y: z.number().finite().min(-10).max(110) }).strict(),
  CARD_RESIZE: z.object({ id: CARD_ID, width: z.number().finite().min(10).max(55), height: z.number().finite().min(10).max(48) }).strict(),
  CARD_ARRANGE: z.object({}).strict(),
  CORE_STATE: z.object({ state: z.enum(['idle', 'listening', 'thinking', 'executing', 'speaking', 'warning']) }).strict(),
  NOTIFY: z.object({ message: z.string().min(1).max(1000) }).strict()
} as const;

const AI_ACTION_TYPES = ['CARD_OPEN', 'CARD_CLOSE', 'CARD_FOCUS', 'CARD_MINIMIZE', 'CARD_RESTORE', 'CARD_MOVE', 'CARD_RESIZE', 'CARD_ARRANGE', 'CORE_STATE', 'NOTIFY'] as const;
const actionType = z.enum(AI_ACTION_TYPES);

export const aiActionProposalSchema = z.object({
  type: actionType,
  payload: z.unknown(),
  risk: z.enum(['low', 'medium', 'high', 'critical']),
  approvalRequired: z.boolean().default(false),
  correlationId: z.string().regex(/^[A-Za-z0-9._:-]{8,160}$/).optional(),
  capabilityId: z.string().regex(/^[A-Za-z0-9._:-]{8,160}$/),
  sessionId: z.string().regex(/^[A-Za-z0-9._:-]{8,160}$/),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/)
}).strict();

export type AiActionProposal = z.infer<typeof aiActionProposalSchema>;

export interface AiTrustBoundaryOptions {
  router?: CommandRouter;
  capabilities: CapabilityRegistry;
  sessionId: string;
  now?: () => number;
  maxProposalBytes?: number;
  approvalRequiredForRisk?: readonly RiskLevel[];
}

/**
 * AI output is treated as untrusted data. This boundary validates and authorizes
 * a narrow UI intent before a HoloCommand can be created. It never executes an
 * action and never grants capabilities.
 */
export class AiTrustBoundary {
  private readonly router: CommandRouter;
  private readonly now: () => number;
  private readonly maxProposalBytes: number;
  private readonly approvalRequiredForRisk: ReadonlySet<RiskLevel>;
  private readonly replay = new ReplayGuard(60_000, 2048);

  constructor(private readonly options: AiTrustBoundaryOptions) {
    this.router = options.router ?? new CommandRouter();
    this.now = options.now ?? Date.now;
    this.maxProposalBytes = options.maxProposalBytes ?? 32 * 1024;
    this.approvalRequiredForRisk = new Set(options.approvalRequiredForRisk ?? ['high', 'critical']);
    if (!/^[A-Za-z0-9._:-]{8,160}$/.test(options.sessionId)) throw new Error('invalid_ai_session_id');
  }

  parse(value: unknown): AiActionProposal {
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new Error('ai_proposal_invalid');
    if (new TextEncoder().encode(encoded).byteLength > this.maxProposalBytes) throw new Error('ai_proposal_too_large');
    const result = aiActionProposalSchema.safeParse(value);
    if (!result.success) throw new Error('ai_proposal_invalid');
    return result.data;
  }

  authorize(value: unknown): HoloCommand {
    const proposal = this.parse(value);
    if (proposal.sessionId !== this.options.sessionId) throw new Error('ai_session_mismatch');
    if (!this.replay.accept(proposal.nonce, this.now())) throw new Error('ai_proposal_replay');

    const schema = actionSchemas[proposal.type as keyof typeof actionSchemas];
    if (!schema || !schema.safeParse(proposal.payload).success) throw new Error('ai_action_payload_invalid');
    const capabilityRisk = this.options.capabilities.risk(proposal.capabilityId);
    if (!capabilityRisk) throw new Error('capability_denied');
    if (proposal.risk !== capabilityRisk) throw new Error('ai_risk_mismatch');
    if (!this.options.capabilities.allows(proposal.capabilityId, proposal.type, this.options.sessionId, this.now())) throw new Error('capability_denied');

    const approvalRequired = proposal.approvalRequired || this.approvalRequiredForRisk.has(capabilityRisk);
    if (approvalRequired && proposal.type !== 'NOTIFY' && proposal.type !== 'CORE_STATE') {
      // The command remains non-executable until the host's existing approval flow resolves it.
      // This boundary only carries the requirement; it does not approve it.
    }

    const command = this.router.create(proposal.type, proposal.payload, 'ai', 'session', {
      approvalRequired,
      correlationId: proposal.correlationId,
      sessionId: this.options.sessionId,
      capabilityId: proposal.capabilityId
    });

    if (command.sessionId !== this.options.sessionId || command.capabilityId !== proposal.capabilityId) throw new Error('ai_authorization_context_lost');
    if (requiredScope(command.type) !== requiredScope(proposal.type)) throw new Error('ai_scope_mapping_failed');
    return command;
  }
}
