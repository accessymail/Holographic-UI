export class RateLimiter {
  private windowStartedAt = Date.now();
  private count = 0;

  constructor(private readonly maxPerSecond: number, private readonly windowMs = 1000) {
    if (!Number.isInteger(maxPerSecond) || maxPerSecond < 1) throw new Error('invalid_rate_limit');
  }

  accept(now = Date.now()): boolean {
    if (now - this.windowStartedAt >= this.windowMs) {
      this.windowStartedAt = now;
      this.count = 0;
    }
    if (this.count >= this.maxPerSecond) return false;
    this.count += 1;
    return true;
  }

  reset(): void {
    this.windowStartedAt = Date.now();
    this.count = 0;
  }
}
