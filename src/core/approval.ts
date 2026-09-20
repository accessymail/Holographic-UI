import type { ApprovalRequest } from './types';
import { sha256Base64Url } from './secure-utils';

export interface ApprovalDecision {
  requestId: string;
  commandId: string;
  decision: 'approved' | 'denied';
  decidedAt: number;
  parametersDigest?: string;
}

export async function digestApprovalParameters(value: unknown): Promise<string> {
  return sha256Base64Url(JSON.stringify(value));
}

export function validateApprovalRequest(request: ApprovalRequest, now = Date.now()): void {
  if (!request.id || !request.commandId) throw new Error('approval_identity_missing');
  if (request.expiresAt <= request.createdAt || request.expiresAt <= now) throw new Error('approval_expired');
  if (!request.title.trim() || !request.description.trim()) throw new Error('approval_content_missing');
  if (request.title.length > 240 || request.description.length > 2000) throw new Error('approval_content_too_large');
  if (request.id.length < 8 || request.commandId.length < 8) throw new Error('approval_identity_invalid');
  if (!Number.isSafeInteger(request.createdAt) || !Number.isSafeInteger(request.expiresAt)) throw new Error('approval_timestamp_invalid');
}
