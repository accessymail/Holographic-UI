import { describe, expect, it } from 'vitest';
import { RateLimiter } from '../rate-limit';

describe('RateLimiter', () => {
  it('limits events inside a window', () => {
    const limiter = new RateLimiter(2);
    expect(limiter.accept(1000)).toBe(true);
    expect(limiter.accept(1001)).toBe(true);
    expect(limiter.accept(1002)).toBe(false);
    expect(limiter.accept(2000)).toBe(true);
  });
});
