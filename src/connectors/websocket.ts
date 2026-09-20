import { safeParseEvent, safeParseWireEnvelope, type WireEnvelope } from '../core/protocol';
import { isSecureTransport } from '../core/security';
import { RateLimiter } from '../core/rate-limit';
import { randomNonce } from '../core/secure-utils';
import type { ConnectorCapabilities, HoloCommand, HoloConnector, HoloEvent } from '../core/types';
import { PROTOCOL_VERSION } from '../core/types';

export interface WebSocketConnectorOptions {
  url: string;
  tokenProvider?: () => Promise<string | null>;
  requireAuthentication?: boolean;
  connectTimeoutMs?: number;
  reconnect?: boolean;
  maxReconnectDelayMs?: number;
  maxMessageBytes?: number;
  clientName?: string;
  allowInsecureLocalhost?: boolean;
  maxMessagesPerSecond?: number;
}

export class WebSocketConnector implements HoloConnector {
  readonly id = 'websocket';
  readonly capabilities: ConnectorCapabilities = {
    protocol: PROTOCOL_VERSION, commands: [], events: [], screenUnderstanding: false,
    handTracking: false, secureExecution: false, hitl: true
  };

  private socket: WebSocket | null = null;
  private listeners = new Set<(event: HoloEvent) => void>();
  private reconnectTimer: number | undefined;
  private closedByUser = false;
  private reconnectDelay = 500;
  private authenticated = false;
  private clientNonce = '';
  private sessionId: string | undefined;
  private generation = 0;
  private readonly outboundLimiter: RateLimiter;

  constructor(private readonly options: WebSocketConnectorOptions) {
    const parsed = new URL(options.url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
    if (parsed.username || parsed.password) throw new Error('websocket_url_credentials_rejected');
    if (!isSecureTransport(options.url, options.allowInsecureLocalhost ?? false)) throw new Error('insecure_transport_rejected');
    if ((options.requireAuthentication ?? true) && !options.tokenProvider) throw new Error('token_provider_required');
    this.outboundLimiter = new RateLimiter(options.maxMessagesPerSecond ?? 120);
  }

  connect(): Promise<void> {
    this.closedByUser = false;
    const generation = ++this.generation;
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.options.url);
      this.socket = socket;
      const isCurrent = () => this.generation === generation && this.socket === socket;
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (error) reject(error); else resolve();
      };
      const timeout = window.setTimeout(() => {
        socket.close(1008, 'handshake_timeout');
        finish(new Error('websocket_handshake_timeout'));
      }, this.options.connectTimeoutMs ?? 7000);

      socket.onopen = async () => {
        if (!isCurrent()) return;
        this.reconnectDelay = 500;
        this.authenticated = false;
        this.sessionId = undefined;
        this.clientNonce = randomNonce(24);
        socket.send(JSON.stringify({ protocol: PROTOCOL_VERSION, kind: 'HELLO', id: crypto.randomUUID(), timestamp: Date.now(), client: this.options.clientName ?? 'holographic-ui', clientNonce: this.clientNonce } satisfies WireEnvelope));
        try {
          const token = await this.options.tokenProvider?.();
          if ((this.options.requireAuthentication ?? true) && !token) {
            socket.close(1008, 'auth_token_missing');
            finish(new Error('websocket_auth_token_missing'));
            return;
          }
          if (token) socket.send(JSON.stringify({ protocol: PROTOCOL_VERSION, kind: 'AUTH', id: crypto.randomUUID(), timestamp: Date.now(), clientNonce: this.clientNonce, token } satisfies WireEnvelope));
          if (!(this.options.requireAuthentication ?? true)) this.authenticated = true;
        } catch {
          socket.close(1008, 'auth_failed');
          finish(new Error('websocket_auth_failed'));
        }
      };
      socket.onerror = () => {
        if (!isCurrent()) return;
        if (!settled) finish(new Error('websocket_connection_failed'));
      };
      socket.onclose = () => {
        if (!isCurrent()) return;
        this.authenticated = false;
        this.sessionId = undefined;
        if (!settled) finish(new Error('websocket_closed_before_ready'));
        if (!this.closedByUser && (this.options.reconnect ?? true)) this.scheduleReconnect();
      };
      socket.onmessage = (message) => {
        if (!isCurrent() || typeof message.data !== 'string') return;
        if (new TextEncoder().encode(message.data).byteLength > (this.options.maxMessageBytes ?? 256 * 1024)) { socket.close(1009, 'message_too_large'); return; }
        let raw: unknown;
        try { raw = JSON.parse(message.data); } catch { return; }
        const parsed = safeParseWireEnvelope(raw);
        if (!parsed.success) return;
        const envelope = parsed.data;
        if (envelope.kind !== 'EVENT') return;
        const eventResult = safeParseEvent(envelope.event);
        if (!eventResult.success) return;
        const event = eventResult.data;
        if (event.type === 'READY') {
          if (!event.sessionId) {
            socket.close(1008, 'missing_session');
            finish(new Error('websocket_ready_missing_session'));
            return;
          }
          this.authenticated = true;
          this.sessionId = event.sessionId;
          finish();
        } else if (this.authenticated && (!event.sessionId || event.sessionId !== this.sessionId)) {
          socket.close(1008, 'session_mismatch');
          return;
        }
        this.listeners.forEach(listener => listener(event));
      };
    });
  }

  async disconnect(): Promise<void> {
    this.closedByUser = true;
    this.generation += 1; this.authenticated = false; this.sessionId = undefined;
    if (this.reconnectTimer !== undefined) window.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined; this.socket?.close(1000, 'client_disconnect'); this.socket = null;
  }

  async send(command: HoloCommand): Promise<void> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) throw new Error('websocket_not_connected');
    if ((this.options.requireAuthentication ?? true) && !this.authenticated) throw new Error('websocket_not_authenticated');
    if (command.sessionId && this.sessionId && command.sessionId !== this.sessionId) throw new Error('websocket_session_mismatch');
    if (!this.outboundLimiter.accept()) throw new Error('websocket_rate_limited');
    const envelope = { protocol: PROTOCOL_VERSION, kind: 'COMMAND', command } satisfies WireEnvelope;
    const serialized = JSON.stringify(envelope);
    if (new TextEncoder().encode(serialized).byteLength > (this.options.maxMessageBytes ?? 256 * 1024)) throw new Error('command_too_large');
    this.socket.send(serialized);
  }

  onEvent(handler: (event: HoloEvent) => void): () => void { this.listeners.add(handler); return () => this.listeners.delete(handler); }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== undefined) return;
    const jitter = Math.floor(Math.random() * 250);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect().catch(() => { this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.options.maxReconnectDelayMs ?? 30_000); this.scheduleReconnect(); });
    }, this.reconnectDelay + jitter);
  }
}
