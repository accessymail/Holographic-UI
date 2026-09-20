import type { ScreenUnderstandingResult } from '../core/types';

export interface ScreenFrame {
  capturedAt: number;
  width: number;
  height: number;
  source: 'local-display' | 'window' | 'camera' | 'accessibility';
  opaque: unknown;
}

export interface ScreenUnderstandingAdapter {
  readonly id: string;
  readonly local: boolean;
  capture(): Promise<ScreenFrame>;
  analyze(frame: ScreenFrame): Promise<ScreenUnderstandingResult>;
}
