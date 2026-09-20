import { z } from 'zod';
import { COMMAND_TYPES, PROTOCOL_VERSION, type HoloCommand, type HoloEvent, type HoloEventType } from './types';

const id = z.string().regex(/^[A-Za-z0-9._:-]{8,160}$/);
const timestamp = z.number().int().nonnegative();

const cardId = z.string().regex(/^[a-zA-Z0-9._:-]{1,128}$/);
const payloadSchemas: Record<(typeof COMMAND_TYPES)[number], z.ZodTypeAny> = {
  CARD_OPEN: z.object({ id: cardId }).strict(),
  CARD_CLOSE: z.object({ id: cardId }).strict(),
  CARD_FOCUS: z.object({ id: cardId }).strict(),
  CARD_MINIMIZE: z.object({ id: cardId }).strict(),
  CARD_RESTORE: z.object({ id: cardId }).strict(),
  CARD_MOVE: z.object({ id: cardId, x: z.number().finite().min(-10).max(110), y: z.number().finite().min(-10).max(110) }).strict(),
  CARD_RESIZE: z.object({ id: cardId, width: z.number().finite().min(10).max(55), height: z.number().finite().min(10).max(48) }).strict(),
  CARD_ARRANGE: z.object({}).strict(),
  CORE_STATE: z.object({ state: z.enum(['idle','listening','thinking','executing','speaking','warning']) }).strict(),
  NOTIFY: z.object({ message: z.string().min(1).max(1000) }).strict(),
  REQUEST_APPROVAL: z.object({ requestId: cardId }).strict(),
  APPROVAL_DECISION: z.object({ requestId: cardId, decision: z.enum(['approved', 'denied']), parametersDigest: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/).optional() }).strict()
};

export function validateCommandPayload(command: Pick<HoloCommand, 'type' | 'payload'>): boolean {
  return payloadSchemas[command.type].safeParse(command.payload).success;
}

const commandSchema = z.object({
  protocol: z.literal(PROTOCOL_VERSION), id, type: z.enum(COMMAND_TYPES), payload: z.unknown(),
  source: z.enum(['user', 'gesture', 'ai', 'backend', 'system']),
  authority: z.enum(['ui', 'session', 'operator', 'system']),
  createdAt: timestamp, expiresAt: timestamp,
  approvalRequired: z.boolean().optional(), correlationId: id.optional(), sessionId: id.optional(),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/).optional(),
  sequence: z.number().int().nonnegative().optional(), capabilityId: id.optional()
}).strict();

const eventTypes = [
  'HELLO', 'AUTH_REQUIRED', 'READY', 'AI_STATE', 'CARD_STATE', 'TASK_UPDATE', 'SCREEN_CONTEXT',
  'GESTURE', 'NOTIFY', 'APPROVAL_REQUESTED', 'APPROVAL_RESOLVED', 'EXECUTION_RESULT',
  'ERROR', 'TELEMETRY', 'POLICY_UPDATE'
] as const satisfies readonly HoloEventType[];

const eventSchema = z.object({
  protocol: z.literal(PROTOCOL_VERSION), id, type: z.enum(eventTypes), timestamp,
  payload: z.unknown(), correlationId: id.optional(), sessionId: id.optional(),
  nonce: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/).optional(), sequence: z.number().int().nonnegative().optional()
}).strict();

export function parseCommand(value: unknown): HoloCommand { return commandSchema.parse(value) as HoloCommand; }
export function safeParseCommand(value: unknown) { return commandSchema.safeParse(value) as ReturnType<typeof commandSchema.safeParse>; }
export function parseEvent(value: unknown): HoloEvent { return eventSchema.parse(value) as HoloEvent; }
export function safeParseEvent(value: unknown) {
  const result = eventSchema.safeParse(value);
  if (!result.success) return result as ReturnType<typeof eventSchema.safeParse>;
  if (result.data.type === 'READY' && !result.data.sessionId) {
    return { success: false, error: new z.ZodError([{ code: 'custom', path: ['sessionId'], message: 'READY requires sessionId' }]) } as ReturnType<typeof eventSchema.safeParse>;
  }
  return result as ReturnType<typeof eventSchema.safeParse>;
}

export type WireEnvelope =
  | { protocol: typeof PROTOCOL_VERSION; kind: 'HELLO'; id: string; timestamp: number; client: string; clientNonce: string; bootstrapToken?: string }
  | { protocol: typeof PROTOCOL_VERSION; kind: 'AUTH'; id: string; timestamp: number; clientNonce: string; token: string }
  | { protocol: typeof PROTOCOL_VERSION; kind: 'PING'; id: string; timestamp: number }
  | { protocol: typeof PROTOCOL_VERSION; kind: 'COMMAND'; command: HoloCommand }
  | { protocol: typeof PROTOCOL_VERSION; kind: 'EVENT'; event: HoloEvent };

export const wireEnvelopeSchema = z.discriminatedUnion('kind', [
  z.object({ protocol: z.literal(PROTOCOL_VERSION), kind: z.literal('HELLO'), id, timestamp, client: z.string().min(1).max(64), clientNonce: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/), bootstrapToken: z.string().min(1).max(8192).optional() }).strict(),
  z.object({ protocol: z.literal(PROTOCOL_VERSION), kind: z.literal('AUTH'), id, timestamp, clientNonce: z.string(), token: z.string().min(1).max(8192) }).strict(),
  z.object({ protocol: z.literal(PROTOCOL_VERSION), kind: z.literal('PING'), id, timestamp }).strict(),
  z.object({ protocol: z.literal(PROTOCOL_VERSION), kind: z.literal('COMMAND'), command: commandSchema }).strict(),
  z.object({ protocol: z.literal(PROTOCOL_VERSION), kind: z.literal('EVENT'), event: eventSchema }).strict()
]);

export function safeParseWireEnvelope(value: unknown) { return wireEnvelopeSchema.safeParse(value); }
