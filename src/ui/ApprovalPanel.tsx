import { motion } from 'motion/react';
import type { ApprovalRequest } from '../core/types';

export function ApprovalPanel({ request, onApprove, onDeny }: { request: ApprovalRequest; onApprove: () => void; onDeny: () => void }) {
  const seconds = Math.max(0, Math.ceil((request.expiresAt - Date.now()) / 1000));
  return <motion.div className="approval" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} role="dialog" aria-modal="true" aria-labelledby="approval-title">
    <div className="approval-kicker">HUMAN-IN-THE-LOOP · {request.risk.toUpperCase()}</div>
    <strong id="approval-title">{request.title}</strong>
    <p>{request.description}</p>
    <p className="approval-meta">REQUEST {request.id.slice(0, 12)} · EXPIRES {seconds}s</p>
    <div className="approval-actions"><button onClick={onDeny}>DENY</button><button onClick={onApprove}>APPROVE</button></div>
  </motion.div>;
}
