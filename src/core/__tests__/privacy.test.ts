import { describe, expect, it } from 'vitest';
import { DEFAULT_PRIVACY_POLICY, PrivacyController } from '../privacy';

describe('PrivacyController', () => {
  it('requires explicit screen-analysis consent', () => {
    const controller = new PrivacyController();
    expect(controller.hasConsent('screen-analysis')).toBe(false);
    controller.grantConsent({ grantedAt: Date.now(), purpose: 'screen-analysis', scope: 'one-shot' });
    expect(controller.hasConsent('screen-analysis')).toBe(true);
  });

  it('expires consent', () => {
    const controller = new PrivacyController();
    controller.grantConsent({ grantedAt: 1000, expiresAt: 2000, purpose: 'screen-analysis', scope: 'session' });
    expect(controller.hasConsent('screen-analysis', 1999)).toBe(true);
    expect(controller.hasConsent('screen-analysis', 2000)).toBe(false);
  });

  it('rejects frame persistence', () => {
    const controller = new PrivacyController();
    expect(() => controller.setPolicy({ ...DEFAULT_PRIVACY_POLICY, persistFrames: true as false })).toThrow('frame_persistence_not_supported');
  });

  it('redacts sensitive result entities and summary terms', () => {
    const controller = new PrivacyController();
    const result = controller.sanitizeResult({
      summary: 'A password field and API key are visible',
      entities: [
        { id: '1', role: 'password-field', label: 'Password' },
        { id: '2', role: 'button', label: 'Continue' }
      ],
      confidence: 0.9,
      privacy: 'remote-opt-in'
    });
    expect(result.summary).toContain('[REDACTED]');
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]?.label).toBe('Continue');
  });
});
