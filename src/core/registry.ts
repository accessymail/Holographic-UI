import type { Accent, CardKind, HoloCardModel } from './types';

export interface CardDefinition {
  id: string;
  title: string;
  kind: CardKind;
  accent?: Accent;
  defaultSize?: { width: number; height: number };
  renderKey?: string;
  permissions?: string[];
}

export interface ExtensionManifest {
  id: string;
  version: string;
  displayName: string;
  entry: string;
  permissions: string[];
  isolation: 'builtin' | 'sandboxed-iframe' | 'native-process';
}

export class CardRegistry {
  private definitions = new Map<string, CardDefinition>();

  register(definition: CardDefinition): void {
    if (!/^[a-z0-9._-]+$/.test(definition.id)) throw new Error('invalid_card_id');
    if (this.definitions.has(definition.id)) throw new Error('card_already_registered');
    this.definitions.set(definition.id, definition);
  }

  get(id: string): CardDefinition | undefined { return this.definitions.get(id); }
  list(): CardDefinition[] { return [...this.definitions.values()]; }

  instantiate(id: string, position: { x: number; y: number }, zIndex: number): HoloCardModel {
    const def = this.definitions.get(id);
    if (!def) throw new Error('card_not_registered');
    return {
      id: def.id, title: def.title, kind: def.kind, state: 'opening',
      x: position.x, y: position.y,
      width: def.defaultSize?.width ?? 25,
      height: def.defaultSize?.height ?? 20,
      zIndex, accent: def.accent, data: { renderKey: def.renderKey, permissions: def.permissions ?? [] }
    };
  }
}
