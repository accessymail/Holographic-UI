import type { ReactNode } from 'react';

export function HudFrame({ children }: { children: ReactNode }) {
  return <div className="hud-frame" aria-hidden="true"><div className="hud-inner" />{children}</div>;
}
