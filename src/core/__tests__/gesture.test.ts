import { describe, expect, it } from 'vitest';
import { HandGestureMapper } from '../../adapters/gesture';

function landmarks(pinchDistance: number, palmX = 0.5, palmY = 0.5) {
  const points = Array.from({ length: 21 }, () => ({ x: palmX, y: palmY, z: 0 }));
  points[4] = { x: 0.5 + pinchDistance, y: 0.5, z: 0 };
  points[8] = { x: 0.5, y: 0.5, z: 0 };
  for (const i of [8, 12, 16, 20]) points[i] = { x: points[i]!.x, y: 0.2, z: 0 };
  return points;
}

describe('HandGestureMapper', () => {
  it('uses hysteresis so a pinch does not chatter near the threshold', () => {
    const mapper = new HandGestureMapper('test', { gestureCooldownMs: 0 });
    expect(mapper.map(landmarks(0.04), 1000).map(e => e.type)).toContain('pinch');
    expect(mapper.map(landmarks(0.065), 1100).map(e => e.type)).not.toContain('pinch');
    expect(mapper.map(landmarks(0.08), 1200).map(e => e.type)).toContain('pinch');
  });

  it('rejects low-confidence tracking', () => {
    const mapper = new HandGestureMapper();
    expect(mapper.map(landmarks(0.04), 1000, 0.4)).toEqual([]);
  });

  it('bounds normalized points', () => {
    const mapper = new HandGestureMapper();
    const points = landmarks(0.04, 2, -1);
    const event = mapper.map(points, 1000).find(e => e.type === 'pinch');
    expect(event?.point).toEqual({ x: 100, y: 0 });
  });
});
