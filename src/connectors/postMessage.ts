import { safeParseEvent, safeParseWireEnvelope, type WireEnvelope } from '../core/protocol';
import type { HoloCommand, HoloConnector, HoloEvent, ConnectorCapabilities } from '../core/types';
import { PROTOCOL_VERSION } from '../core/types';
import { randomNonce, utf8ByteLength } from '../core/secure-utils';
import { RateLimiter } from '../core/rate-limit';

export interface PostMessageConnectorOptions {
  targetWindow: Window;
  targetOrigin: string;
  allowedEventOrigins: readonly string[];
  bootstrapTokenProvider?: () => Promise<string | null>;
  requireAuthentication?: boolean;
  maxMessageBytes?: number;
  maxMessagesPerSecond?: number;
}

export class PostMessageConnector implements HoloConnector {
  readonly id = 'postmessage';
  readonly capabilities: ConnectorCapabilities = {
    protocol: PROTOCOL_VERSION, commands: [], events: [], screenUnderstanding: false,
    handTracking: false, secureExecution: false, hitl: true
  };
  private listeners = new Set<(event: HoloEvent) => void>();
  private attached = false;
  private authenticated = false;
  private readonly sessionNonce = randomNonce(24);
  private sessionId?: string;
  private readonly outboundLimiter: RateLimiter;

  constructor(private readonly options: PostMessageConnectorOptions) {
    if (options.targetWindow === window) throw new Error('same_window_target_rejected');
    if (options.targetOrigin === '*' || !options.targetOrigin.startsWith('https://')) throw new Error('explicit_https_target_origin_required');
    if (!options.allowedEventOrigins.includes(options.targetOrigin)) throw new Error('target_origin_must_be_allowlisted');
    if ((options.requireAuthentication ?? true) && !options.bootstrapTokenProvider) throw new Error('bootstrap_token_provider_required');
    this.outboundLimiter = new RateLimiter(options.maxMessagesPerSecond ?? 120);
  }

  async connect(): Promise<void> {
    if (this.attached) return;
    window.addEventListener('message', this.onMessage);
    this.attached = true;
    const token = await this.options.bootstrapTokenProvider?.();
    if ((this.options.requireAuthentication ?? true) && !token) throw new Error('bootstrap_token_missing');
    const envelope = { protocol: PROTOCOL_VERSION, kind: 'HELLO', id: crypto.randomUUID(), timestamp: Date.now(), client: 'holographic-ui-postmessage', clientNonce: this.sessionNonce } satisfies WireEnvelope;
    this.options.targetWindow.postMessage({ ...envelope, bootstrapToken: token ?? undefined }, this.options.targetOrigin);
  }

  async disconnect(): Promise<void> { window.removeEventListener('message', this.onMessage); this.attached = false; this.authenticated = false; this.sessionId = undefined; }

  async send(command: HoloCommand): Promise<void> {
    if ((this.options.requireAuthentication ?? true) && !this.authenticated) throw new Error('postmessage_not_authenticated');
    if (!this.outboundLimiter.accept()) throw new Error('postmessage_rate_limited');
    const envelope = { protocol: PROTOCOL_VERSION, kind: 'COMMAND', command } satisfies WireEnvelope;
    if (utf8ByteLength(JSON.stringify(envelope)) > (this.options.maxMessageBytes ?? 256 * 1024)) throw new Error('command_too_large');
    this.options.targetWindow.postMessage(envelope, this.options.targetOrigin);
  }

  onEvent(handler: (event: HoloEvent) => void): () => void { this.listeners.add(handler); return () => this.listeners.delete(handler); }

  private readonly onMessage = (message: MessageEvent<unknown>) => {
    if (message.source !== this.options.targetWindow) return;
    if (!this.options.allowedEventOrigins.includes(message.origin)) return;
    const parsedEnvelope = safeParseWireEnvelope(message.data);
    if (!parsedEnvelope.success || parsedEnvelope.data.kind !== 'EVENT') return;
    const result = safeParseEvent(parsedEnvelope.data.event);
    if (!result.success) return;
    const event = result.data;
    if (event.type === 'READY') {
      if (!event.sessionId) return;
      this.authenticated = true;
      this.sessionId = event.sessionId;
    } else if (this.authenticated && (!event.sessionId || event.sessionId !== this.sessionId)) {
      return;
    }
    this.listeners.forEach(listener => listener(event));
  };
}
