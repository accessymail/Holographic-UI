import { HolographicRuntime } from '../runtime/HolographicRuntime';
import type { HoloConnector } from '../core/types';

export interface CreateHUIOptions {
  connector?: HoloConnector;
}

export function createHUI(options: CreateHUIOptions = {}): HolographicRuntime {
  const runtime = new HolographicRuntime();
  if (options.connector) void runtime.connect(options.connector);
  return runtime;
}
