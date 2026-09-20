import { motion, useReducedMotion } from 'motion/react';
import type { HoloCardModel } from '../core/types';

interface Props {
  card: HoloCardModel;
  onFocus: () => void;
  onMinimize: () => void;
  onMove: (x: number, y: number) => void;
}

function CardBody({ card }: { card: HoloCardModel }) {
  if (card.kind === 'telemetry') return <>
    <div className="metric-list"><div>FRAME RATE <b>60 FPS</b></div><div>PARTICLES <b>128.4K</b></div><div>GPU LOAD <b>27%</b></div><div>EVENT BUS <b>0.4 ms</b></div></div>
    <div className="bars">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ height: `${25 + ((i * 17) % 70)}%` }} />)}</div>
  </>;
  if (card.kind === 'agent') return <div className="agent-list"><Agent active name="PERCEPTION" detail="screen context / 3.2ms" /><Agent active name="PLANNER" detail="task graph / 12 nodes" /><Agent name="EXECUTOR" detail="awaiting authority" /><Agent active name="MEMORY" detail="retrieval / 18 hits" /></div>;
  if (card.kind === 'world') return <div className="world-grid"><div><span>MODE</span><b>DESKTOP</b></div><div><span>FOCUS</span><b>AI WORKFLOW</b></div><div><span>WINDOWS</span><b>08</b></div><div><span>ALERTS</span><b>00</b></div><div><span>VISION</span><b>LOCAL</b></div><div><span>POLICY</span><b>ENFORCED</b></div></div>;
  if (card.kind === 'execution') return <div className="execution-card"><div className="execution-state"><span className="live-pill">SECURE GATEWAY</span><strong>HUMAN APPROVAL READY</strong></div><div className="execution-route"><span>AI REQUEST</span><b>→</b><span>POLICY</span><b>→</b><span>APPROVAL</span><b>→</b><span>EXECUTION</span></div><div className="scanline" /></div>;
  return <p>Backend-defined card payload. Keep arbitrary data out of privileged UI state and render only through a trusted card renderer or sandboxed extension.</p>;
}

function Agent({ active, name, detail }: { active?: boolean; name: string; detail: string }) {
  return <div className="agent-row"><i className={active ? 'active' : ''} /><div><b>{name}</b><small>{detail}</small></div></div>;
}

export function FloatingCard({ card, onFocus, onMinimize, onMove }: Props) {
  const reduced = useReducedMotion();
  const minimized = card.state === 'minimized';
  return <motion.article
    layout
    className="holo-card"
    data-accent={card.accent ?? 'cyan'}
    data-state={card.state}
    onPointerDown={onFocus}
    initial={reduced ? false : { opacity: 0, scale: 0.92, y: 10 }}
    animate={{ opacity: minimized ? 0.5 : 1, scale: minimized ? 0.62 : 1, y: 0 }}
    transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 290, damping: 25 }}
    style={{ left: `${card.x}%`, top: `${card.y}%`, width: `${card.width}%`, height: `${card.height}%`, zIndex: card.zIndex }}
    drag={minimized ? false : true}
    dragMomentum={false}
    dragElastic={0.04}
    onDragEnd={(_, info) => {
      const parent = (info.point.x >= 0) ? document.querySelector('.scene') : null;
      const rect = parent?.getBoundingClientRect();
      if (!rect) return;
      const x = ((info.point.x - rect.left) / rect.width) * 100 - card.width / 2;
      const y = ((info.point.y - rect.top) / rect.height) * 100 - card.height / 2;
      onMove(Math.max(1, Math.min(x, 99 - card.width)), Math.max(3, Math.min(y, 95 - card.height)));
    }}
  >
    <div className="card-rail" />
    <header className="card-header"><span className="card-status" /> <span className="card-kicker">HUI</span><strong>{card.title}</strong><button onClick={(e) => { e.stopPropagation(); onMinimize(); }} aria-label={minimized ? 'Restore card' : 'Minimize card'}>{minimized ? '＋' : '—'}</button></header>
    <div className="card-body"><CardBody card={card} /></div>
    <footer className="card-footer"><span>LIVE</span><span className="card-id">{card.id.toUpperCase()}</span></footer>
  </motion.article>;
}
