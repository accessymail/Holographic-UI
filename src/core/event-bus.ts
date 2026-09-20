export type Handler<T> = (payload: T) => void;

export class EventBus<E extends object> {
  private handlers = new Map<keyof E, Set<Handler<unknown>>>();

  on<K extends keyof E>(type: K, handler: Handler<E[K]>): () => void {
    const set = this.handlers.get(type) ?? new Set<Handler<unknown>>();
    set.add(handler as Handler<unknown>);
    this.handlers.set(type, set);
    return () => set.delete(handler as Handler<unknown>);
  }

  once<K extends keyof E>(type: K, handler: Handler<E[K]>): () => void {
    const off = this.on(type, (payload) => { off(); handler(payload); });
    return off;
  }

  emit<K extends keyof E>(type: K, payload: E[K]): void {
    this.handlers.get(type)?.forEach((handler) => handler(payload));
  }

  clear(): void { this.handlers.clear(); }
}
