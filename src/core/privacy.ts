import type { PrivacyPolicy, ScreenUnderstandingResult } from './types';

export const DEFAULT_PRIVACY_POLICY: PrivacyPolicy = Object.freeze({
  screenCapture: 'user-consent',
  remoteAnalysis: 'opt-in',
  persistFrames: false,
  maxAnalysisPixels: 1920 * 1080,
  redactSensitiveRegions: true
});

export interface PrivacyConsent {
  grantedAt: number;
  expiresAt?: number;
  purpose: 'screen-analysis' | 'camera-gesture';
  scope: 'session' | 'one-shot';
}

export class PrivacyController {
  private consent = new Map<PrivacyConsent['purpose'], PrivacyConsent>();
  constructor(private policy: PrivacyPolicy = DEFAULT_PRIVACY_POLICY) {}
  get current(): PrivacyPolicy { return this.policy; }
  setPolicy(next: PrivacyPolicy): void {
    if (!['disabled', 'user-consent', 'policy-controlled'].includes(next.screenCapture)) throw new Error('invalid_screen_capture_policy');
    if (!['disabled', 'opt-in', 'policy-controlled'].includes(next.remoteAnalysis)) throw new Error('invalid_remote_analysis_policy');
    if (next.persistFrames !== false) throw new Error('frame_persistence_not_supported');
    if (!Number.isSafeInteger(next.maxAnalysisPixels) || next.maxAnalysisPixels < 320 * 240 || next.maxAnalysisPixels > 7680 * 4320) throw new Error('invalid_analysis_resolution');
    if (typeof next.redactSensitiveRegions !== 'boolean') throw new Error('invalid_redaction_policy');
    this.policy = Object.freeze({ ...next });
    if (next.screenCapture === 'disabled') this.revoke('screen-analysis');
    if (next.remoteAnalysis === 'disabled') this.revoke('screen-analysis');
  }
  canCapture(): boolean { return this.policy.screenCapture !== 'disabled'; }
  canRemoteAnalyze(): boolean { return this.policy.remoteAnalysis !== 'disabled'; }
  grantConsent(consent: PrivacyConsent): void {
    if (!Number.isSafeInteger(consent.grantedAt) || consent.grantedAt <= 0) throw new Error('invalid_consent_timestamp');
    if (consent.expiresAt !== undefined && consent.expiresAt <= consent.grantedAt) throw new Error('invalid_consent_expiry');
    if (consent.purpose === 'screen-analysis' && !this.canCapture()) throw new Error('screen_capture_disabled_by_policy');
    if (consent.purpose === 'screen-analysis' && consent.scope === 'session' && this.policy.remoteAnalysis === 'opt-in') {
      // Session consent explicitly covers remote analysis only when the caller separately grants it.
    }
    this.consent.set(consent.purpose, Object.freeze({ ...consent }));
  }
  hasConsent(purpose: PrivacyConsent['purpose'], now = Date.now()): boolean {
    const value = this.consent.get(purpose);
    if (!value) return false;
    if (value.expiresAt !== undefined && value.expiresAt <= now) { this.consent.delete(purpose); return false; }
    return true;
  }
  revoke(purpose?: PrivacyConsent['purpose']): void {
    if (purpose) this.consent.delete(purpose); else this.consent.clear();
  }
  sanitizeResult(result: ScreenUnderstandingResult): ScreenUnderstandingResult {
    if (!this.policy.redactSensitiveRegions) return result;
    const sensitive = /password|passcode|token|secret|credit.?card|cvv|one.?time|otp|private.?key|seed.?phrase|api.?key/i;
    const redactedSummary = result.summary.replace(/\b(password|passcode|token|secret|credit.?card|cvv|one.?time|otp|private.?key|seed.?phrase|api.?key)\b/gi, '[REDACTED]');
    return {
      ...result,
      summary: redactedSummary,
      entities: result.entities.filter(entity => !sensitive.test(`${entity.role} ${entity.label ?? ''}`))
    };
  }
}
