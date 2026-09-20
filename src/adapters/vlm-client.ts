import { z } from 'zod';
import type { ScreenAnalyzer, ScreenAnalyzerInput } from './screen-understanding';
import type { ScreenUnderstandingResult } from '../core/types';

const entitySchema = z.object({
  id: z.string().min(1).max(128),
  role: z.string().min(1).max(128),
  label: z.string().max(512).optional(),
  bounds: z.object({
    x: z.number().finite().min(-1).max(2),
    y: z.number().finite().min(-1).max(2),
    width: z.number().finite().min(0).max(2),
    height: z.number().finite().min(0).max(2)
  }).strict().optional()
}).strict();

const resultSchema = z.object({
  summary: z.string().max(16_384),
  entities: z.array(entitySchema).max(512),
  confidence: z.number().finite().min(0).max(1),
  privacy: z.enum(['local', 'remote-opt-in'])
}).strict();

export interface VLMClientOptions {
  endpoint: string;
  tokenProvider?: () => Promise<string | null>;
  sessionIdProvider?: () => string | null;
  correlationIdProvider?: () => string | null;
  timeoutMs?: number;
  headers?: Record<string, string>;
  maxResponseBytes?: number;
  maxRequestBytes?: number;
}

async function readBoundedText(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) {
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error('vlm_response_too_large');
    return text;
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let output = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel('vlm_response_too_large');
        throw new Error('vlm_response_too_large');
      }
      output += decoder.decode(value, { stream: true });
    }
    output += decoder.decode();
    return output;
  } finally {
    reader.releaseLock();
  }
}

/** Generic remote VLM adapter. Model output is data only; it is never executed as a command. */
export class HttpVLMClient implements ScreenAnalyzer {
  constructor(private readonly options: VLMClientOptions) {
    const url = new URL(options.endpoint);
    if (url.protocol !== 'https:') throw new Error('vlm_https_required');
    if (url.username || url.password) throw new Error('vlm_url_credentials_rejected');
    if ((options.timeoutMs ?? 10_000) < 250 || (options.timeoutMs ?? 10_000) > 60_000) throw new Error('vlm_timeout_invalid');
    if ((options.maxResponseBytes ?? 256 * 1024) < 1024) throw new Error('vlm_response_limit_invalid');
    if ((options.maxRequestBytes ?? 4 * 1024 * 1024) < 1024) throw new Error('vlm_request_limit_invalid');
  }

  async analyze(input: ScreenAnalyzerInput): Promise<ScreenUnderstandingResult> {
    const blob = await new Promise<Blob | null>((resolve) => input.frame.toBlob(resolve, 'image/webp', 0.82));
    if (!blob) throw new Error('screen_frame_encoding_failed');
    if (blob.size > (this.options.maxRequestBytes ?? 4 * 1024 * 1024)) throw new Error('vlm_request_too_large');

    const token = await this.options.tokenProvider?.();
    const sessionId = this.options.sessionIdProvider?.();
    const correlationId = this.options.correlationIdProvider?.();
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort('vlm_timeout'), this.options.timeoutMs ?? 10_000);
    const onAbort = () => controller.abort(input.signal?.reason);
    input.signal?.addEventListener('abort', onAbort, { once: true });

    try {
      const form = new FormData();
      form.set('frame', blob, 'screen.webp');
      const response = await fetch(this.options.endpoint, {
        method: 'POST',
        headers: {
          ...(this.options.headers ?? {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(sessionId ? { 'X-HUI-Session': sessionId } : {}),
          ...(correlationId ? { 'X-HUI-Correlation': correlationId } : {})
        },
        body: form,
        signal: controller.signal,
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer'
      });
      if (!response.ok) throw new Error(`vlm_request_failed:${response.status}`);
      const contentType = response.headers.get('content-type') ?? '';
      if (!/^application\/json(?:\s*;|$)/i.test(contentType)) throw new Error('vlm_invalid_content_type');
      const maxResponseBytes = this.options.maxResponseBytes ?? 256 * 1024;
      const declaredLength = Number(response.headers.get('content-length') ?? '0');
      if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) throw new Error('vlm_response_too_large');
      const body = await readBoundedText(response, maxResponseBytes);
      let unknownValue: unknown;
      try { unknownValue = JSON.parse(body); } catch { throw new Error('vlm_invalid_json'); }
      const parsed = resultSchema.safeParse(unknownValue);
      if (!parsed.success) throw new Error('invalid_vlm_response');
      return parsed.data;
    } finally {
      input.signal?.removeEventListener('abort', onAbort);
      globalThis.clearTimeout(timeout);
    }
  }
}
