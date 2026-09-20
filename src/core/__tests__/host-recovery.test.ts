import { describe, expect, it } from 'vitest';
import { HostRecoveryController } from '../host-recovery';

describe('host recovery', () => {
  it('fails closed after repeated failures and limits recovery attempts', () => {
    let now = 1000;
    const controller = new HostRecoveryController({ maxConsecutiveFailures: 2, cooldownMs: 100, maxRecoveryAttempts: 1 }, () => now);
    controller.start(); controller.failure(); controller.failure();
    expect(controller.snapshot().state).toBe('degraded');
    expect(controller.canRecover()).toBe(false);
    now += 100;
    expect(controller.beginRecovery()).toBe(1);
    expect(controller.snapshot().state).toBe('recovering');
    expect(controller.canRecover()).toBe(false);
  });

  it('resets failure state only after explicit success', () => {
    const controller = new HostRecoveryController({ maxConsecutiveFailures: 1 });
    controller.start(); controller.failure();
    expect(controller.snapshot().state).toBe('degraded');
    expect(() => controller.start()).not.toThrow();
    controller.success();
    expect(controller.snapshot().failures).toBe(0);
    expect(controller.snapshot().state).toBe('ready');
  });
});
