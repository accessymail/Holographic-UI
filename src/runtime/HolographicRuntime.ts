import { AuditTrail } from '../core/audit';
import { CommandRouter } from '../core/command-router';
import { EventBus } from '../core/event-bus';
import { balancedLayout, clampCard } from '../core/layout';
import { DEFAULT_PRIVACY_POLICY, PrivacyController } from '../core/privacy';
import { SecurityPolicyClient } from '../core/security';
import { SessionManager } from '../core/session';
import { HoloStore } from '../core/store';
import { validateApprovalRequest } from '../core/approval';
import type { ApprovalDecision } from '../core/approval';
import type { HoloConnector, HoloEvent, HoloCommandType, CommandSource, CommandAuthority, CapabilityGrant, ApprovalRequest } from '../core/types';

export interface RuntimeEvents {
  command: ReturnType<CommandRouter['create']>;
  event: HoloEvent;
  error: Error;
  audit: ReturnType<AuditTrail['record']>;
}

export class HolographicRuntime {
  readonly store = new HoloStore();
  readonly security = new SecurityPolicyClient();
  readonly session = new SessionManager();
  readonly capabilities = this.session.capabilities;
  readonly privacy = new PrivacyController(DEFAULT_PRIVACY_POLICY);
  readonly audit = new AuditTrail();
  readonly router = new CommandRouter(this.security);
  readonly events = new EventBus<RuntimeEvents>();
  private connector: HoloConnector | null = null;
  private detachConnector: (() => void) | null = null;
  private sessionId: string | null = null;

  async connect(connector: HoloConnector): Promise<void> {
    await this.disconnect();
    this.connector = connector;
    const session = this.session.start();
    this.sessionId = session.id;
    this.detachConnector = connector.onEvent(event => this.handleEvent(event));
    try {
      await connector.connect();
      this.store.setConnected(true);
      this.auditRecord({ action: 'connector.connect', outcome: 'accepted', correlationId: session.id });
      if (connector.id !== 'websocket' && connector.id !== 'postmessage') {
        this.session.authenticate();
        this.store.setAuthenticated(true);
      }
    } catch (error) {
      this.store.setConnected(false);
      this.auditRecord({ action: 'connector.connect', outcome: 'error', reason: 'connection_failed', correlationId: session.id });
      this.events.emit('error', error instanceof Error ? error : new Error('connector_connect_failed'));
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.detachConnector?.();
    this.detachConnector = null;
    if (this.connector) await this.connector.disconnect();
    this.connector = null;
    this.sessionId = null;
    this.capabilities.clear();
    this.session.end();
    this.security.resetSession();
    this.store.setConnected(false);
    this.store.setAuthenticated(false);
  }

  grantCapability(grant: CapabilityGrant): void {
    this.session.grant(grant);
    this.auditRecord({ action: 'capability.grant', outcome: 'accepted' });
  }

  async command<T>(type: HoloCommandType, payload: T, source: CommandSource = 'user', authority: CommandAuthority = 'ui', options?: { approvalRequired?: boolean; correlationId?: string; capabilityId?: string }): Promise<void> {
    try {
      const command = this.router.create(type, payload, source, authority, { ...options, sessionId: this.sessionId ?? undefined, capabilityId: options?.capabilityId });
      if (source === 'ai' || source === 'backend') {
        if (!options?.capabilityId || !this.sessionId || !this.capabilities.allows(options.capabilityId, type, this.sessionId)) {
          throw new Error('capability_denied');
        }
      }
      this.applyLocalCommand(command.type, command.payload);
      this.events.emit('command', command);
      this.auditRecord({ action: `command.${type}`, outcome: 'accepted', commandId: command.id, correlationId: command.correlationId });
      if (this.connector) await this.connector.send(command);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('command_failed');
      this.auditRecord({ action: `command.${type}`, outcome: 'rejected', reason: err.message });
      this.events.emit('error', err);
      throw err;
    }
  }

  requestApproval(request: ApprovalRequest): void {
    validateApprovalRequest(request);
    this.store.setApproval(request);
    this.auditRecord({ action: 'approval.request', outcome: 'requested', commandId: request.commandId });
  }

  async resolveApproval(decision: ApprovalDecision): Promise<void> {
    const request = this.store.state.pendingApproval;
    if (!request || request.id !== decision.requestId || request.commandId !== decision.commandId) throw new Error('approval_request_mismatch');
    validateApprovalRequest(request);
    if (request.parametersDigest && request.parametersDigest !== decision.parametersDigest) throw new Error('approval_parameters_mismatch');
    this.store.setApproval(null);
    this.auditRecord({ action: 'approval.resolve', outcome: decision.decision, commandId: decision.commandId });
    await this.command('APPROVAL_DECISION', decision, 'user', 'ui');
  }

  arrange(mode: 'balanced' | 'focus' = 'balanced'): void {
    this.store.update(state => { if (mode === 'balanced') balancedLayout(state.cards); state.cards.forEach(clampCard); });
    this.auditRecord({ action: 'layout.arrange', outcome: 'accepted' });
  }

  private applyLocalCommand(type: HoloCommandType, payload: unknown): void {
    const objectPayload = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    switch (type) {
      case 'CORE_STATE': { const state = String(objectPayload.state ?? ''); if (['idle','listening','thinking','executing','speaking','warning'].includes(state)) this.store.setAIState(state as never); break; }
      case 'CARD_OPEN': this.cardState(String(objectPayload.id ?? ''), 'active'); break;
      case 'CARD_CLOSE': this.cardState(String(objectPayload.id ?? ''), 'closing'); break;
      case 'CARD_FOCUS': this.store.focusCard(String(objectPayload.id ?? '')); break;
      case 'CARD_MINIMIZE': this.cardState(String(objectPayload.id ?? ''), 'minimized'); break;
      case 'CARD_RESTORE': this.cardState(String(objectPayload.id ?? ''), 'active'); break;
      case 'CARD_RESIZE': { const { id, width, height } = objectPayload; if (typeof id === 'string' && typeof width === 'number' && typeof height === 'number') this.store.update(s => { const card = s.cards.find(c => c.id === id); if (card) { card.width = width; card.height = height; clampCard(card); } }); break; }
      case 'CARD_MOVE': { const { id, x, y } = objectPayload; if (typeof id === 'string' && typeof x === 'number' && typeof y === 'number') this.store.update(s => { const card = s.cards.find(c => c.id === id); if (card) { card.x = x; card.y = y; clampCard(card); } }); break; }
      case 'CARD_ARRANGE': this.arrange(); break;
      case 'NOTIFY': if (typeof objectPayload.message === 'string') this.store.notify(objectPayload.message); break;
      default: break;
    }
  }

  private cardState(id: string, state: 'active' | 'closing' | 'minimized'): void { if (!id) return; this.store.update(s => { const card = s.cards.find(c => c.id === id); if (card) card.state = state; }); }

  private handleEvent(event: HoloEvent): void {
    const check = this.security.validateEvent(event);
    if (check.ok === false) { this.auditRecord({ action: 'event.reject', outcome: 'rejected', reason: check.reason }); this.events.emit('error', new Error(check.reason)); return; }
    if (this.sessionId) {
      if (event.type !== 'READY' && this.store.state.authenticated && !event.sessionId) {
        this.auditRecord({ action: 'event.reject', outcome: 'rejected', reason: 'missing_session', correlationId: event.correlationId });
        return;
      }
      if (event.sessionId && event.sessionId !== this.sessionId) {
        this.auditRecord({ action: 'event.reject', outcome: 'rejected', reason: 'session_mismatch', correlationId: event.correlationId });
        return;
      }
    }
    if (event.type === 'READY') {
      this.session.authenticate();
      this.store.setAuthenticated(true);
    }
    if (event.type === 'AI_STATE' && event.payload && typeof event.payload === 'object' && 'state' in event.payload) { const next = String((event.payload as {state: unknown}).state); if (['idle','listening','thinking','executing','speaking','warning'].includes(next)) this.store.setAIState(next as never); }
    if (event.type === 'TELEMETRY' && event.payload && typeof event.payload === 'object') { const fps = (event.payload as {fps?: unknown}).fps; if (typeof fps === 'number' && Number.isFinite(fps)) this.store.update(s => { s.fps = Math.max(0, Math.min(240, fps)); }); }
    if (event.type === 'NOTIFY' && event.payload && typeof event.payload === 'object' && 'message' in event.payload) { const message = (event.payload as {message: unknown}).message; if (typeof message === 'string') this.store.notify(message); }
    if (event.type === 'APPROVAL_REQUESTED' && event.payload && typeof event.payload === 'object') {
      try {
        const request = event.payload as ApprovalRequest;
        validateApprovalRequest(request);
        this.store.setApproval(request);
      } catch {
        this.auditRecord({ action: 'approval.reject', outcome: 'rejected', reason: 'invalid_approval_request', correlationId: event.correlationId });
        return;
      }
    }
    this.events.emit('event', event);
    this.auditRecord({ action: `event.${event.type}`, outcome: 'accepted', correlationId: event.correlationId });
  }

  private auditRecord(input: Parameters<AuditTrail['record']>[0]): void {
    const record = this.audit.record(input);
    this.events.emit('audit', record);
  }
}
