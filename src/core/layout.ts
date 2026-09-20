import type { HoloCardModel } from './types';

export interface LayoutOptions { margin?: number; gap?: number; }

export function balancedLayout(cards: HoloCardModel[], options: LayoutOptions = {}): HoloCardModel[] {
  const margin = options.margin ?? 4;
  const gap = options.gap ?? 3;
  const visible = cards.filter((c) => c.state !== 'hidden' && c.state !== 'closing' && !c.pinned);
  if (visible.length === 0) return cards;

  const columns = visible.length <= 4 ? 2 : 3;
  const rows = Math.ceil(visible.length / columns);
  const cellWidth = (100 - margin * 2 - gap * (columns - 1)) / columns;
  const cellHeight = (100 - margin * 2 - gap * (rows - 1)) / rows;

  visible.forEach((card, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    card.x = Number((margin + col * (cellWidth + gap)).toFixed(2));
    card.y = Number((margin + row * (cellHeight + gap)).toFixed(2));
    card.width = Number(Math.min(card.width, cellWidth).toFixed(2));
    card.height = Number(Math.min(card.height, cellHeight).toFixed(2));
  });
  return cards;
}

export function clampCard(card: HoloCardModel): void {
  card.width = Math.max(12, Math.min(card.width, 55));
  card.height = Math.max(10, Math.min(card.height, 48));
  card.x = Math.max(1, Math.min(card.x, 99 - card.width));
  card.y = Math.max(3, Math.min(card.y, 95 - card.height));
}
