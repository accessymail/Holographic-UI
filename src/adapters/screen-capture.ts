import type { PrivacyPolicy } from '../core/types';
import type { ScreenFrame } from './screen';

export interface ScreenCaptureOptions {
  policy?: PrivacyPolicy;
  onStateChange?: (active: boolean) => void;
}

/**
 * Explicit, non-persistent display capture boundary. The raw canvas is returned to the caller
 * and is never cached by this class. The host decides whether and where analysis occurs.
 */
export class LocalScreenCapture {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private readonly policy: PrivacyPolicy;
  private readonly onStateChange?: (active: boolean) => void;

  constructor(options: ScreenCaptureOptions = {}) {
    this.policy = options.policy ?? {
      screenCapture: 'user-consent', remoteAnalysis: 'opt-in', persistFrames: false,
      maxAnalysisPixels: 1920 * 1080, redactSensitiveRegions: true
    };
    this.onStateChange = options.onStateChange;
  }

  async start(): Promise<void> {
    if (this.stream) return;
    if (this.policy.screenCapture === 'disabled') throw new Error('screen_capture_disabled_by_policy');
    if (!navigator.mediaDevices?.getDisplayMedia) throw new Error('display_capture_unavailable');
    this.stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 15, max: 30 } }, audio: false });
    const track = this.stream.getVideoTracks()[0];
    track?.addEventListener('ended', () => void this.stop());
    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.srcObject = this.stream;
    await video.play();
    this.video = video;
    this.onStateChange?.(true);
  }

  async captureFrame(): Promise<ScreenFrame> {
    if (!this.video) throw new Error('screen_capture_not_started');
    const width = this.video.videoWidth;
    const height = this.video.videoHeight;
    if (!width || !height) throw new Error('screen_capture_frame_unavailable');
    const scale = Math.min(1, Math.sqrt(this.policy.maxAnalysisPixels / (width * height)));
    const outWidth = Math.max(1, Math.floor(width * scale));
    const outHeight = Math.max(1, Math.floor(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outWidth; canvas.height = outHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('canvas_context_unavailable');
    ctx.drawImage(this.video, 0, 0, outWidth, outHeight);
    return { capturedAt: Date.now(), width: outWidth, height: outHeight, source: 'local-display', opaque: canvas };
  }

  async stop(): Promise<void> {
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    this.video?.remove(); this.video = null;
    this.onStateChange?.(false);
  }
}
