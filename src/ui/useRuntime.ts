import { useSyncExternalStore } from 'react';
import type { HolographicRuntime } from '../runtime/HolographicRuntime';

export function useRuntimeState(runtime: HolographicRuntime) {
  return useSyncExternalStore(
    (onChange) => runtime.store.events.on('change', () => onChange()),
    () => runtime.store.state,
    () => runtime.store.state
  );
}
