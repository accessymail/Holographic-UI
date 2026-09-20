import { EventBus } from './event-bus';
import { SecurityPolicyClient } from './security';
import { PROTOCOL_VERSION, type CommandAuthority, type CommandSource, type HoloCommand, type HoloCommandType } from './types';

interface RouterEvents {
  accepted: HoloCommand;
  rejected: { command: HoloCommand; reason: string };
}

export class CommandRouter {
  readonly events = new EventBus<RouterEvents>();
  private readonly security: SecurityPolicyClient;

  constructor(security = new SecurityPolicyClient()) { this.security = security; }

  validate(command: HoloCommand, now = Date.now()): { ok: true } | { ok: false; reason: string } {
    return this.security.validateCommand(command, now);
  }

  create<T>(
    type: HoloCommandType,
    payload: T,
    source: CommandSource,
    authority: CommandAuthority,
    options?: { approvalRequired?: boolean; correlationId?: string; sessionId?: string; capabilityId?: string }
  ): HoloCommand<T> {
    const now = Date.now();
    const command: HoloCommand<T> = {
      protocol: PROTOCOL_VERSION,
      id: crypto.randomUUID(),
      type,
      payload,
      source,
      authority,
      createdAt: now,
      expiresAt: now + 10_000,
      nonce: crypto.randomUUID().replace(/-/g, ''),
      approvalRequired: options?.approvalRequired,
      correlationId: options?.correlationId,
      sessionId: options?.sessionId,
      capabilityId: options?.capabilityId
    };
    const result = this.validate(command);
    if (result.ok === false) {
      this.events.emit('rejected', { command, reason: result.reason });
      throw new Error(result.reason);
    }
    this.events.emit('accepted', command);
    return command;
  }
}
