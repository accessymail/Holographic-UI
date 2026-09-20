import { useEffect, useMemo, useState } from 'react';
import { ParticleField } from '../ui/ParticleField';
import { HoloCore } from '../ui/HoloCore';
import { FloatingCard } from '../ui/FloatingCard';
import { HudFrame } from '../ui/HudFrame';
import { ApprovalPanel } from '../ui/ApprovalPanel';
import { useRuntimeState } from '../ui/useRuntime';
import type { HolographicRuntime } from '../runtime/HolographicRuntime';

export function App({ runtime }: { runtime: HolographicRuntime }) {
  const state = useRuntimeState(runtime);
  const approval = state.pendingApproval;
  const [reduced, setReduced] = useState(false);
  const active = useMemo(() => state.aiState.toUpperCase(), [state.aiState]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update(); mq.addEventListener('change', update); return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (k === '1') void runtime.command('CORE_STATE', { state: 'listening' });
      if (k === '2') void runtime.command('CORE_STATE', { state: 'thinking' });
      if (k === '3') void runtime.command('CORE_STATE', { state: 'executing' });
      if (k === '0') void runtime.command('CORE_STATE', { state: 'idle' });
      if (k === 'a') runtime.arrange();
      if (k === 'm') { const id = state.focusedCardId ?? state.cards[0]?.id; if (id) void runtime.command(state.cards.find(c => c.id === id)?.state === 'minimized' ? 'CARD_RESTORE' : 'CARD_MINIMIZE', { id }); }
      if (k === 'p') runtime.requestApproval({ id: crypto.randomUUID(), commandId: crypto.randomUUID(), title: 'Demo approval request', description: 'This demonstration approval does not authorize native execution. A production backend must independently verify and authorize the approved request.', risk: 'medium', createdAt: Date.now(), expiresAt: Date.now() + 30_000 });
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [runtime, state.cards, state.focusedCardId]);

  return <main className={`app-shell ${reduced ? 'reduced-motion' : ''}`}>
    <ParticleField />
    <HudFrame />
    <header className="topbar">
      <div><span className="brand">HOLOGRAPHIC<span>UI</span></span><span className="version">/ RUNTIME 1.0</span></div>
      <div className="telemetry"><span>RENDER <b>{state.fps} FPS</b></span><span>GPU <b>AUTO</b></span><span>BUS <b>{state.connected ? (state.authenticated ? 'AUTHENTICATED' : 'CONNECTED') : 'OFFLINE'}</b></span></div>
    </header>
    <section className="scene">
      <div className="top-sweep" />
      <div className="scene-label left">CLUSTER / HUI-01</div>
      <div className="scene-label right">PIPELINE / {active}</div>
      <div className="cards">
        {state.cards.map(card => <FloatingCard key={card.id} card={card} onFocus={() => runtime.store.focusCard(card.id)} onMinimize={() => void runtime.command(card.state === 'minimized' ? 'CARD_RESTORE' : 'CARD_MINIMIZE', { id: card.id })} onMove={(x, y) => void runtime.command('CARD_MOVE', { id: card.id, x, y })} />)}
      </div>
      <HoloCore state={state.aiState} />
      <aside className="side-readout"><div>ORCHESTRATOR</div><strong>{active}</strong><div className="side-line" /><div>COMMAND BUS</div><strong>ALLOWLIST</strong><div className="side-line" /><div>AUTHORITY</div><strong>SESSION</strong><div className="side-line" /><div>VISION</div><strong>LOCAL / OPTIONAL</strong></aside>
      <div className="bottom-toolbar">
        <button onClick={() => runtime.arrange()}>AUTO ARRANGE</button>
        <button onClick={() => void runtime.command('CORE_STATE', { state: 'thinking' })}>COGNITION</button>
        <button onClick={() => void runtime.command('CORE_STATE', { state: 'executing' })}>EXECUTE</button>
        <button onClick={() => runtime.requestApproval({ id: crypto.randomUUID(), commandId: crypto.randomUUID(), title: 'Demo approval request', description: 'This demonstration approval does not authorize native execution. A production backend must independently verify and authorize the approved request.', risk: 'medium', createdAt: Date.now(), expiresAt: Date.now() + 30_000 })}>HITL</button>
        <button onClick={() => { state.cards.forEach(card => { if (card.state === 'minimized') void runtime.command('CARD_RESTORE', { id: card.id }); }); runtime.store.setAIState('idle'); }}>RESET</button>
      </div>
      {approval && <ApprovalPanel request={approval} onDeny={() => void runtime.resolveApproval({ requestId: approval.id, commandId: approval.commandId, decision: 'denied', decidedAt: Date.now(), parametersDigest: approval.parametersDigest })} onApprove={() => void runtime.resolveApproval({ requestId: approval.id, commandId: approval.commandId, decision: 'approved', decidedAt: Date.now(), parametersDigest: approval.parametersDigest })} />}
      {state.notifications[0] && <div className="toast">{state.notifications[0]}</div>}
    </section>
    <footer className="help">1 LISTEN · 2 THINK · 3 EXECUTE · A ARRANGE · M MINIMIZE · P HITL · DRAG CARDS</footer>
  </main>;
}
