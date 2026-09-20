export type HostLifecycle = 'ready' | 'running' | 'degraded' | 'recovering' | 'stopped';

export interface HostHealth {
  state: HostLifecycle;
  failures: number;
  lastFailureAt?: number;
  lastSuccessAt?: number;
  generation: number;
}

export interface HostRecoveryPolicy {
  maxConsecutiveFailures: number;
  cooldownMs: number;
  maxRecoveryAttempts: number;
}

const DEFAULT_POLICY: HostRecoveryPolicy = {
  maxConsecutiveFailures: 3,
  cooldownMs: 1_000,
  maxRecoveryAttempts: 2
};

/** Fail-closed host lifecycle controller. Recovery never grants new authority. */
export class HostRecoveryController {
  private health: HostHealth = { state: 'ready', failures: 0, generation: 0 };
  private recoveryAttempts = 0;
  private readonly policy: HostRecoveryPolicy;

  constructor(policy: Partial<HostRecoveryPolicy> = {}, private readonly now = Date.now) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
  }

  start(): void {
    if (this.health.state === 'stopped') throw new Error('host_stopped');
    if (this.health.state === 'recovering') throw new Error('host_recovering');
    this.health = { ...this.health, state: 'running', failures: 0 };
  }

  success(): void {
    this.health = { ...this.health, state: 'ready', failures: 0, lastSuccessAt: this.now() };
    this.recoveryAttempts = 0;
  }

  failure(): void {
    const failures = this.health.failures + 1;
    this.health = { ...this.health, failures, lastFailureAt: this.now(), state: failures >= this.policy.maxConsecutiveFailures ? 'degraded' : 'running' };
  }

  canRecover(): boolean {
    if (this.health.state !== 'degraded') return false;
    if (this.recoveryAttempts >= this.policy.maxRecoveryAttempts) return false;
    if (!this.health.lastFailureAt) return true;
    return this.now() - this.health.lastFailureAt >= this.policy.cooldownMs;
  }

  beginRecovery(): number {
    if (!this.canRecover()) throw new Error('host_recovery_not_allowed');
    this.recoveryAttempts += 1;
    this.health = { ...this.health, state: 'recovering', generation: this.health.generation + 1 };
    return this.health.generation;
  }

  stop(): void {
    this.health = { ...this.health, state: 'stopped' };
  }

  snapshot(): HostHealth { return Object.freeze({ ...this.health }); }
}
