export const PROTOCOL_VERSION = 'hui/1.0' as const;
export const PROTOCOL_MIN_VERSION = 'hui/1.0' as const;

export type AIState = 'idle' | 'listening' | 'thinking' | 'executing' | 'speaking' | 'warning';
export type CardState = 'opening' | 'active' | 'minimized' | 'hidden' | 'closing';
export type CardKind = 'telemetry' | 'agent' | 'world' | 'execution' | 'text' | 'image' | 'custom';
export type Accent = 'cyan' | 'blue' | 'violet' | 'amber' | 'red';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Point2D { x: number; y: number }
export interface Size2D { width: number; height: number }

export interface HoloCardModel {
  id: string;
  title: string;
  kind: CardKind;
  state: CardState;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  pinned?: boolean;
  accent?: Accent;
  minimizedScale?: number;
  data?: Record<string, unknown>;
}

export interface GestureEvent {
  id: string;
  type: 'pinch' | 'drag' | 'swipe' | 'zoom' | 'open-palm' | 'fist' | 'clap' | 'hover';
  point?: Point2D;
  delta?: Point2D;
  scale?: number;
  confidence: number;
  timestamp: number;
  source: string;
}

export const COMMAND_TYPES = [
  'CARD_OPEN', 'CARD_CLOSE', 'CARD_FOCUS', 'CARD_MINIMIZE', 'CARD_RESTORE',
  'CARD_MOVE', 'CARD_RESIZE', 'CARD_ARRANGE', 'CORE_STATE', 'NOTIFY',
  'REQUEST_APPROVAL', 'APPROVAL_DECISION'
] as const;
export type HoloCommandType = typeof COMMAND_TYPES[number];

export type CommandSource = 'user' | 'gesture' | 'ai' | 'backend' | 'system';
export type CommandAuthority = 'ui' | 'session' | 'operator' | 'system';

/** A UI command is intentionally not an execution command. Native/side-effecting actions belong behind a backend policy gateway. */
export interface HoloCommand<T = unknown> {
  protocol: typeof PROTOCOL_VERSION;
  id: string;
  type: HoloCommandType;
  payload: T;
  source: CommandSource;
  authority: CommandAuthority;
  createdAt: number;
  expiresAt: number;
  approvalRequired?: boolean;
  correlationId?: string;
  sessionId?: string;
  nonce?: string;
  sequence?: number;
  capabilityId?: string;
}

export type HoloEventType =
  | 'HELLO'
  | 'AUTH_REQUIRED'
  | 'READY'
  | 'AI_STATE'
  | 'CARD_STATE'
  | 'TASK_UPDATE'
  | 'SCREEN_CONTEXT'
  | 'GESTURE'
  | 'NOTIFY'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_RESOLVED'
  | 'EXECUTION_RESULT'
  | 'ERROR'
  | 'TELEMETRY'
  | 'POLICY_UPDATE';

export interface HoloEvent<T = unknown> {
  protocol: typeof PROTOCOL_VERSION;
  id: string;
  type: HoloEventType;
  timestamp: number;
  payload: T;
  correlationId?: string;
  sessionId?: string;
  nonce?: string;
  sequence?: number;
}

export interface ConnectorCapabilities {
  protocol: typeof PROTOCOL_VERSION;
  commands: HoloCommandType[];
  events: HoloEventType[];
  screenUnderstanding: boolean;
  handTracking: boolean;
  secureExecution: boolean;
  hitl: boolean;
  localOnly?: boolean;
}

export interface HoloConnector {
  readonly id: string;
  readonly capabilities: ConnectorCapabilities;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(command: HoloCommand): Promise<void>;
  onEvent(handler: (event: HoloEvent) => void): () => void;
}

export interface PermissionDescriptor {
  id: string;
  description: string;
  risk: RiskLevel;
  requiresApproval: boolean;
}

export interface SecurityPolicy {
  allowedCommandTypes: ReadonlySet<HoloCommandType>;
  requireApprovalFor: ReadonlySet<HoloCommandType>;
  maxCommandTtlMs: number;
  allowedEventOrigins: readonly string[];
  maxPayloadBytes: number;
  maxInboundEventsPerSecond: number;
  clockSkewMs: number;
}

export interface CapabilityGrant {
  id: string;
  scope: readonly string[];
  risk: RiskLevel;
  issuedAt: number;
  expiresAt: number;
  audience: string;
  sessionId: string;
}

export interface ApprovalRequest {
  id: string;
  commandId: string;
  title: string;
  description: string;
  risk: RiskLevel;
  capabilityId?: string;
  createdAt: number;
  expiresAt: number;
  parametersDigest?: string;
}

export interface ScreenUnderstandingResult {
  summary: string;
  entities: Array<{ id: string; role: string; label?: string; bounds?: { x: number; y: number; width: number; height: number } }>;
  confidence: number;
  privacy: 'local' | 'remote-opt-in';
}

export interface PrivacyPolicy {
  screenCapture: 'disabled' | 'user-consent' | 'policy-controlled';
  remoteAnalysis: 'disabled' | 'opt-in' | 'policy-controlled';
  persistFrames: false;
  maxAnalysisPixels: number;
  redactSensitiveRegions: boolean;
}

export interface AuditRecord {
  id: string;
  timestamp: number;
  action: string;
  outcome: 'accepted' | 'rejected' | 'requested' | 'approved' | 'denied' | 'error';
  correlationId?: string;
  commandId?: string;
  reason?: string;
}

export interface RuntimeSnapshot {
  aiState: AIState;
  focusedCardId: string | null;
  connected: boolean;
  authenticated: boolean;
  fps: number;
  gpuHint: string;
  notifications: string[];
  cards: HoloCardModel[];
  pendingApproval: ApprovalRequest | null;
  privacy: PrivacyPolicy;
}
