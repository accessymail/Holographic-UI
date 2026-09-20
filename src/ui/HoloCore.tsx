import { motion } from 'motion/react';
import type { AIState } from '../core/types';

const stateLabels: Record<AIState, string> = {
  idle: 'STANDBY', listening: 'LISTENING', thinking: 'COGNITION', executing: 'EXECUTION', speaking: 'OUTPUT', warning: 'ATTENTION'
};
const speed: Record<AIState, number> = { idle: 18, listening: 10, thinking: 7, executing: 4, speaking: 3, warning: 2 };

export function HoloCore({ state }: { state: AIState }) {
  return (
    <motion.div className={`core-zone state-${state}`} animate={{ scale: state === 'warning' ? [1, 1.04, 1] : 1 }} transition={{ duration: 0.9, repeat: state === 'warning' ? Infinity : 0 }}>
      <div className="core-ring ring-a" />
      <div className="core-ring ring-b" />
      <div className="core-ring ring-c" />
      <motion.div className="core-sphere" animate={{ rotate: 360 }} transition={{ duration: speed[state], repeat: Infinity, ease: 'linear' }}>
        <i /><i /><i /><span />
      </motion.div>
      <div className="core-scan" />
      <div className="core-caption"><span className="core-dot" /> LYRIUM / {stateLabels[state]}</div>
    </motion.div>
  );
}
