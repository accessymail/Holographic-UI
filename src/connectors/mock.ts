import type { ConnectorCapabilities, HoloCommand, HoloConnector, HoloEvent } from '../core/types';
import { PROTOCOL_VERSION } from '../core/types';

export class MockConnector implements HoloConnector {
  readonly id = 'mock';
  readonly capabilities: ConnectorCapabilities = {
    protocol: PROTOCOL_VERSION,
    commands: ['CARD_OPEN','CARD_CLOSE','CARD_FOCUS','CARD_MINIMIZE','CARD_RESTORE','CARD_MOVE','CARD_RESIZE','CARD_ARRANGE','CORE_STATE','NOTIFY','REQUEST_APPROVAL','APPROVAL_DECISION'],
    events: ['HELLO','READY','AI_STATE','NOTIFY','TELEMETRY','APPROVAL_REQUESTED','APPROVAL_RESOLVED','ERROR','AUTH_REQUIRED','POLICY_UPDATE'],
    screenUnderstanding: true, handTracking: true, secureExecution: true, hitl: true, localOnly: true
  };

  private listeners = new Set<(event: HoloEvent) => void>();
  private timer: number | undefined;
  private fps = 60;

  async connect(): Promise<void> {
    this.emit({ protocol: PROTOCOL_VERSION, id: crypto.randomUUID(), type: 'READY', timestamp: Date.now(), payload: { connector: this.id, capabilities: this.capabilities } });
    this.timer = window.setInterval(() => {
      this.fps = 58 + Math.round(Math.random() * 4);
      this.emit({ protocol: PROTOCOL_VERSION, id: crypto.randomUUID(), type: 'TELEMETRY', timestamp: Date.now(), payload: { fps: this.fps, gpu: 21 + Math.round(Math.random() * 18) } });
    }, 1500);
  }

  async disconnect(): Promise<void> {
    if (this.timer !== undefined) window.clearInterval(this.timer);
    this.timer = undefined;
  }

  async send(command: HoloCommand): Promise<void> {
    if (command.type === 'CORE_STATE') {
      const state = typeof command.payload === 'object' && command.payload !== null && 'state' in command.payload
        ? String((command.payload as { state: unknown }).state) : 'idle';
      if (['idle','listening','thinking','executing','speaking','warning'].includes(state)) {
        this.emit({ protocol: PROTOCOL_VERSION, id: crypto.randomUUID(), type: 'AI_STATE', timestamp: Date.now(), payload: { state } }, command.correlationId);
      }
    }
    if (command.type === 'REQUEST_APPROVAL') {
      this.emit({ protocol: PROTOCOL_VERSION, id: crypto.randomUUID(), type: 'APPROVAL_REQUESTED', timestamp: Date.now(), payload: command.payload }, command.id);
    }
    if (command.type === 'APPROVAL_DECISION') {
      const decision = command.payload as { requestId?: string; decision?: string };
      this.emit({ protocol: PROTOCOL_VERSION, id: crypto.randomUUID(), type: 'APPROVAL_RESOLVED', timestamp: Date.now(), payload: decision }, command.id);
    }
    if (command.type === 'NOTIFY') {
      const message = typeof command.payload === 'object' && command.payload !== null && 'message' in command.payload
        ? String((command.payload as { message: unknown }).message) : 'Notification';
      this.emit({ protocol: PROTOCOL_VERSION, id: crypto.randomUUID(), type: 'NOTIFY', timestamp: Date.now(), payload: { message } });
    }
  }

  onEvent(handler: (event: HoloEvent) => void): () => void {
    this.listeners.add(handler); return () => this.listeners.delete(handler);
  }

  private emit(event: HoloEvent, correlationId?: string): void {
    this.listeners.forEach((listener) => listener(correlationId ? { ...event, correlationId } : event));
  }
}
