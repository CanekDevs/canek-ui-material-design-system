/**
 * Caché LRU mínima basada en `Map` (conserva el orden de inserción): cada
 * lectura mueve la entrada al final y, al superar `max`, se descarta la más
 * antigua.
 */
export class LruCache<K, V> {
  private readonly map = new Map<K, V>();

  constructor(private max = 50) {}

  get size(): number {
    return this.map.size;
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key) as V;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  set(key: K, value: V): this {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    while (this.map.size > this.max) {
      const oldest = this.map.keys().next().value as K;
      this.map.delete(oldest);
    }
    return this;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  /** Cambia la capacidad (descarta las entradas más viejas si sobra). */
  resize(max: number): void {
    this.max = Math.max(1, max);
    while (this.map.size > this.max) {
      const oldest = this.map.keys().next().value as K;
      this.map.delete(oldest);
    }
  }

  keys(): IterableIterator<K> {
    return this.map.keys();
  }
}
