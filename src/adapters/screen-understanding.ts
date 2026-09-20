import type { LocalScreenCapture } from './screen-capture';
import type { PrivacyPolicy, ScreenUnderstandingResult } from '../core/types';
import { DEFAULT_PRIVACY_POLICY, PrivacyController } from '../core/privacy';

export interface ScreenAnalyzerInput {
  frame: HTMLCanvasElement;
  capturedAt: number;
  signal?: AbortSignal;
}
export interface ScreenAnalyzer { analyze(input: ScreenAnalyzerInput): Promise<ScreenUnderstandingResult>; }
export interface ScreenFrameRedactor { redact(frame: HTMLCanvasElement): Promise<HTMLCanvasElement>; }
export interface ScreenUnderstandingPipelineOptions {
  capture: LocalScreenCapture;
  analyzer: ScreenAnalyzer;
  remote?: boolean;
  privacy?: PrivacyPolicy;
  privacyController?: PrivacyController;
  frameRedactor?: ScreenFrameRedactor;
}

/** Privacy-gated screen understanding. Raw frames are released immediately after analysis. */
export class ScreenUnderstandingPipeline {
  private readonly privacy: PrivacyController;
  constructor(private readonly options: ScreenUnderstandingPipelineOptions) {
    this.privacy = options.privacyController ?? new PrivacyController(options.privacy ?? DEFAULT_PRIVACY_POLICY);
  }

  async analyzeOnce(signal?: AbortSignal): Promise<ScreenUnderstandingResult> {
    const policy = this.privacy.current;
    if (policy.screenCapture === 'disabled') throw new Error('screen_capture_disabled_by_policy');
    if (!this.privacy.hasConsent('screen-analysis')) throw new Error('screen_analysis_requires_explicit_consent');
    if (this.options.remote && policy.remoteAnalysis === 'disabled') throw new Error('remote_analysis_disabled_by_policy');
    if (this.options.remote && policy.remoteAnalysis === 'opt-in' && !this.privacy.hasConsent('screen-analysis')) throw new Error('remote_analysis_requires_explicit_opt_in');
    if (this.options.remote && policy.redactSensitiveRegions && !this.options.frameRedactor) throw new Error('remote_redactor_required_by_policy');

    const frame = await this.options.capture.captureFrame();
    if (!(frame.opaque instanceof HTMLCanvasElement)) throw new Error('unsupported_screen_frame');
    let analysisFrame = frame.opaque;
    let redactedFrame: HTMLCanvasElement | null = null;
    try {
      if (analysisFrame.width * analysisFrame.height > policy.maxAnalysisPixels) {
        const scale = Math.sqrt(policy.maxAnalysisPixels / (analysisFrame.width * analysisFrame.height));
        const resized = document.createElement('canvas');
        resized.width = Math.max(1, Math.floor(analysisFrame.width * scale));
        resized.height = Math.max(1, Math.floor(analysisFrame.height * scale));
        const ctx = resized.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('canvas_context_unavailable');
        ctx.drawImage(analysisFrame, 0, 0, resized.width, resized.height);
        redactedFrame = resized;
        analysisFrame = resized;
      }
      if (this.options.remote && policy.redactSensitiveRegions) {
        const next = await this.options.frameRedactor!.redact(analysisFrame);
        if (next !== analysisFrame && redactedFrame) { redactedFrame.width = 1; redactedFrame.height = 1; }
        redactedFrame = next;
        analysisFrame = next;
      }
      const result = await this.options.analyzer.analyze({ frame: analysisFrame, capturedAt: frame.capturedAt, signal });
      return this.privacy.sanitizeResult(result);
    } finally {
      frame.opaque.width = 1; frame.opaque.height = 1;
      if (redactedFrame && redactedFrame !== frame.opaque) { redactedFrame.width = 1; redactedFrame.height = 1; }
    }
  }
}
