import { useSyncExternalStore } from 'react';
import type { HolographicRuntime } from '../runtime/HolographicRuntime';

export function useHUI(runtime: HolographicRuntime) {
  const subscribe = (onStoreChange: () => void) => runtime.store.events.on('change', onStoreChange);
  return useSyncExternalStore(subscribe, () => runtime.store.state, () => runtime.store.state);
}
