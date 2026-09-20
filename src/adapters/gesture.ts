import type { GestureEvent, Point2D } from '../core/types';

export interface GestureAdapter {
  readonly id: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  onGesture(handler: (event: GestureEvent) => void): () => void;
}

export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface GestureMapperOptions {
  pinchStartDistance?: number;
  pinchEndDistance?: number;
  minConfidence?: number;
  dragMinVelocity?: number;
  smoothing?: number;
  gestureCooldownMs?: number;
}

export function distance(a: HandLandmark, b: HandLandmark): number {
  const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }

/**
 * Vendor-neutral semantic mapper. Feed normalized 21-point hand landmarks from a
 * local tracker (MediaPipe, native CV, etc.). No camera or network access occurs here.
 * Hysteresis, smoothing and cooldowns reduce accidental commands from noisy landmarks.
 */
export class HandGestureMapper {
  private pinchActive = false;
  private lastPoint: Point2D | undefined;
  private lastTimestamp = 0;
  private filteredPoint: Point2D | undefined;
  private lastEmitted = new Map<GestureEvent['type'], number>();
  private readonly options: Required<GestureMapperOptions>;

  constructor(private readonly source = 'hand-landmarks', options: GestureMapperOptions = {}) {
    this.options = {
      pinchStartDistance: options.pinchStartDistance ?? 0.055,
      pinchEndDistance: options.pinchEndDistance ?? 0.075,
      minConfidence: options.minConfidence ?? 0.82,
      dragMinVelocity: options.dragMinVelocity ?? 0.012,
      smoothing: clamp01(options.smoothing ?? 0.35),
      gestureCooldownMs: options.gestureCooldownMs ?? 120
    };
  }

  reset(): void {
    this.pinchActive = false;
    this.lastPoint = undefined;
    this.filteredPoint = undefined;
    this.lastTimestamp = 0;
    this.lastEmitted.clear();
  }

  private emit(type: GestureEvent['type'], point: Point2D, timestamp: number, confidence: number, extra: Partial<GestureEvent> = {}): GestureEvent | null {
    if (confidence < this.options.minConfidence) return null;
    const previous = this.lastEmitted.get(type) ?? 0;
    if (timestamp - previous < this.options.gestureCooldownMs && type !== 'drag') return null;
    this.lastEmitted.set(type, timestamp);
    return { id: crypto.randomUUID(), type, point, confidence, timestamp, source: this.source, ...extra };
  }

  map(landmarks: HandLandmark[], timestamp = Date.now(), trackingConfidence = 1): GestureEvent[] {
    if (landmarks.length < 21 || trackingConfidence < this.options.minConfidence) return [];
    const thumbTip = landmarks[4]!;
    const indexTip = landmarks[8]!;
    const pinchDistance = distance(thumbTip, indexTip);
    const nextPinch = this.pinchActive
      ? pinchDistance <= this.options.pinchEndDistance
      : pinchDistance <= this.options.pinchStartDistance;
    const palm = landmarks[0]!;
    const rawPoint = { x: clamp01(palm.x) * 100, y: clamp01(palm.y) * 100 };
    const alpha = this.options.smoothing;
    const point = this.filteredPoint
      ? { x: this.filteredPoint.x + (rawPoint.x - this.filteredPoint.x) * alpha, y: this.filteredPoint.y + (rawPoint.y - this.filteredPoint.y) * alpha }
      : rawPoint;
    this.filteredPoint = point;
    const events: GestureEvent[] = [];

    if (nextPinch !== this.pinchActive) {
      const event = this.emit('pinch', point, timestamp, trackingConfidence);
      if (event) events.push(event);
      this.pinchActive = nextPinch;
    }

    if (this.lastPoint && timestamp > this.lastTimestamp) {
      const dt = Math.max(1, timestamp - this.lastTimestamp);
      const delta = { x: point.x - this.lastPoint.x, y: point.y - this.lastPoint.y };
      const velocity = Math.hypot(delta.x, delta.y) / dt;
      if (this.pinchActive && velocity >= this.options.dragMinVelocity) {
        const event = this.emit('drag', point, timestamp, trackingConfidence, { delta });
        if (event) events.push(event);
      }
    }

    const extended = [8, 12, 16, 20].every((i) => landmarks[i]!.y < landmarks[i - 2]!.y);
    if (extended && !this.pinchActive) {
      const event = this.emit('open-palm', point, timestamp, trackingConfidence * 0.92);
      if (event) events.push(event);
    }

    this.lastPoint = point;
    this.lastTimestamp = timestamp;
    return events;
  }
}

export interface CameraGestureAdapterOptions {
  video?: HTMLVideoElement;
  getLandmarks: (video: HTMLVideoElement, timestamp: number) => Promise<{ landmarks: HandLandmark[]; confidence: number }>;
  camera?: MediaTrackConstraints;
  onPermissionStateChange?: (state: 'idle' | 'requesting' | 'granted' | 'denied' | 'stopped') => void;
}

/**
 * Browser camera adapter. It owns only the camera stream and forwards landmarks to the
 * mapper. It does not upload frames or retain video. The landmark detector is injected.
 */
export class LocalCameraGestureAdapter implements GestureAdapter {
  readonly id = 'local-camera-gesture';
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private running = false;
  private frameHandle: number | null = null;
  private listeners = new Set<(event: GestureEvent) => void>();
  private readonly mapper: HandGestureMapper;
  private readonly options: CameraGestureAdapterOptions;

  constructor(options: CameraGestureAdapterOptions, mapper = new HandGestureMapper()) {
    this.options = options;
    this.mapper = mapper;
  }

  async start(): Promise<void> {
    if (this.running) return;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('camera_capture_unavailable');
    this.options.onPermissionStateChange?.('requesting');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: this.options.camera ?? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } }, audio: false });
    } catch (error) {
      this.options.onPermissionStateChange?.('denied');
      throw new Error(`camera_permission_denied:${error instanceof Error ? error.name : 'unknown'}`);
    }
    this.video = this.options.video ?? document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.autoplay = true;
    this.video.srcObject = this.stream;
    await this.video.play();
    this.running = true;
    this.options.onPermissionStateChange?.('granted');
    this.scheduleFrame();
  }

  private scheduleFrame(): void {
    if (!this.running || !this.video) return;
    this.frameHandle = requestAnimationFrame(() => void this.processFrame());
  }

  private async processFrame(): Promise<void> {
    if (!this.running || !this.video) return;
    const timestamp = performance.now();
    try {
      const result = await this.options.getLandmarks(this.video, timestamp);
      for (const event of this.mapper.map(result.landmarks, Date.now(), result.confidence)) this.listeners.forEach(listener => listener(event));
    } finally {
      this.scheduleFrame();
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.frameHandle !== null) cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
    this.stream?.getTracks().forEach(track => track.stop());
    this.stream = null;
    if (this.video) this.video.srcObject = null;
    this.video = null;
    this.mapper.reset();
    this.options.onPermissionStateChange?.('stopped');
  }

  onGesture(handler: (event: GestureEvent) => void): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }
}

export class DemoGestureAdapter implements GestureAdapter {
  readonly id = 'demo-gesture';
  private listeners = new Set<(event: GestureEvent) => void>();
  async start(): Promise<void> { /* no camera access in demo mode */ }
  async stop(): Promise<void> { /* no resources */ }
  onGesture(handler: (event: GestureEvent) => void): () => void { this.listeners.add(handler); return () => this.listeners.delete(handler); }
  emit(type: GestureEvent['type'], point?: GestureEvent['point']): void {
    this.listeners.forEach((listener) => listener({ id: crypto.randomUUID(), type, point, confidence: 0.98, timestamp: Date.now(), source: this.id }));
  }
}
