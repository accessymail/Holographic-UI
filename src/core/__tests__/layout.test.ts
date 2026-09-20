import { describe, expect, it } from 'vitest';
import { balancedLayout, clampCard } from '../layout';
import type { HoloCardModel } from '../types';

const card = (id: string): HoloCardModel => ({ id, title:id, kind:'custom', state:'active', x:80, y:90, width:30, height:30, zIndex:1 });

describe('layout engine', () => {
  it('places cards inside viewport percentages', () => {
    const cards = balancedLayout([card('a'), card('b'), card('c'), card('d')]);
    for (const c of cards) { expect(c.x).toBeGreaterThanOrEqual(1); expect(c.y).toBeGreaterThanOrEqual(3); expect(c.x + c.width).toBeLessThanOrEqual(99.01); expect(c.y + c.height).toBeLessThanOrEqual(95.01); }
  });
  it('clamps card dimensions and position', () => {
    const c = card('x'); c.width = 100; c.height = 100; c.x = 100; c.y = 100; clampCard(c);
    expect(c.width).toBe(55); expect(c.height).toBe(48); expect(c.x).toBeLessThanOrEqual(44); expect(c.y).toBeLessThanOrEqual(47);
  });
});
