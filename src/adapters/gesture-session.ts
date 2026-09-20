import type { GestureAdapter } from './gesture';
import type { HolographicRuntime } from '../runtime/HolographicRuntime';

export interface GestureSessionPolicy {
  minConfidence: number;
  requireExplicitStart: boolean;
  allowMove: boolean;
  allowFocus: boolean;
  allowArrange: boolean;
  allowMinimize: boolean;
}

const DEFAULT_POLICY: GestureSessionPolicy = {
  minConfidence: 0.86,
  requireExplicitStart: true,
  allowMove: true,
  allowFocus: true,
  allowArrange: true,
  allowMinimize: true
};

/** Binds semantic gestures to safe UI-only commands. It never invokes OS execution. */
export class GestureSession {
  private detach: (() => void) | null = null;
  private active = false;
  private readonly policy: GestureSessionPolicy;

  constructor(private readonly adapter: GestureAdapter, private readonly runtime: HolographicRuntime, policy: Partial<GestureSessionPolicy> = {}) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
  }

  async start(): Promise<void> {
    if (this.detach) return;
    this.detach = this.adapter.onGesture(event => {
      if (!this.active || event.confidence < this.policy.minConfidence) return;
      const focused = this.runtime.store.state.focusedCardId ?? this.runtime.store.state.cards[0]?.id;
      if (!focused) return;
      if (event.type === 'open-palm' && this.policy.allowArrange) void this.runtime.command('CARD_ARRANGE', {}, 'gesture', 'ui');
      if (event.type === 'fist' && this.policy.allowMinimize) void this.runtime.command('CARD_MINIMIZE', { id: focused }, 'gesture', 'ui');
      if (event.type === 'pinch' && event.point && this.policy.allowFocus) void this.runtime.command('CARD_FOCUS', { id: focused }, 'gesture', 'ui');
      if (event.type === 'drag' && event.point && this.policy.allowMove) void this.runtime.command('CARD_MOVE', { id: focused, x: event.point.x, y: event.point.y }, 'gesture', 'ui');
    });
    await this.adapter.start();
    if (!this.policy.requireExplicitStart) this.active = true;
  }

  activate(): void { this.active = true; }
  deactivate(): void { this.active = false; }
  get isActive(): boolean { return this.active; }

  async stop(): Promise<void> {
    this.active = false;
    this.detach?.(); this.detach = null;
    await this.adapter.stop();
  }
}
