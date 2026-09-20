import { EventBus } from './event-bus';
import type { AIState, HoloCardModel, RuntimeSnapshot, ApprovalRequest, PrivacyPolicy } from './types';
import { DEFAULT_PRIVACY_POLICY } from './privacy';

export interface HoloStoreState extends RuntimeSnapshot {
  cards: HoloCardModel[];
  pendingApproval: ApprovalRequest | null;
  privacy: PrivacyPolicy;
}

const initialCards: HoloCardModel[] = [
  { id: 'telemetry', title: 'SYSTEM TELEMETRY', kind: 'telemetry', state: 'active', x: 56, y: 7, width: 31, height: 20, zIndex: 4, accent: 'cyan' },
  { id: 'agents', title: 'AGENT ACTIVITY', kind: 'agent', state: 'active', x: 4, y: 14, width: 28, height: 24, zIndex: 3, accent: 'blue' },
  { id: 'world', title: 'WORLD STATE', kind: 'world', state: 'active', x: 4, y: 63, width: 27, height: 21, zIndex: 2, accent: 'violet' },
  { id: 'execution', title: 'SECURE EXECUTION', kind: 'execution', state: 'active', x: 64, y: 59, width: 31, height: 25, zIndex: 5, accent: 'cyan' }
];

export class HoloStore {
  private _state: HoloStoreState = {
    aiState: 'idle', focusedCardId: null, connected: false, authenticated: false, fps: 60,
    gpuHint: 'WEBGPU/AUTO', notifications: [], cards: structuredClone(initialCards), pendingApproval: null, privacy: DEFAULT_PRIVACY_POLICY
  };

  readonly events = new EventBus<{ change: HoloStoreState }>();

  get state(): HoloStoreState { return this._state; }

  update(mutator: (state: HoloStoreState) => void): void {
    mutator(this._state);
    this.events.emit('change', this._state);
  }

  setAIState(aiState: AIState): void { this.update((s) => { s.aiState = aiState; }); }
  setConnected(connected: boolean): void { this.update((s) => { s.connected = connected; }); }
  notify(message: string): void { this.update((s) => { s.notifications.unshift(message); s.notifications = s.notifications.slice(0, 5); }); }
  setAuthenticated(authenticated: boolean): void { this.update((s) => { s.authenticated = authenticated; }); }
  setApproval(request: ApprovalRequest | null): void { this.update((s) => { s.pendingApproval = request; }); }
  focusCard(id: string | null): void {
    this.update((s) => {
      s.focusedCardId = id;
      if (!id) return;
      const max = Math.max(...s.cards.map((c) => c.zIndex), 0) + 1;
      for (const card of s.cards) if (card.id === id) card.zIndex = max;
    });
  }
  card(id: string): HoloCardModel | undefined { return this._state.cards.find((c) => c.id === id); }
}
