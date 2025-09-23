/**
 * implementación de caché en memoria con ttl y limpieza automática.
 * útil para reducir llamadas a fuentes de datos externas.
 */
export class LocalCache<T = any> {
  private static instances: Map<string, LocalCache<any>> = new Map();
  private readonly cache: Map<string, CacheItem<T>>;
  private lastCleanup: number;
  private readonly cleanupInterval: number;
  private readonly enableLogging: boolean;

  private constructor(options: LocalCacheConfig = {}) {
    this.cache = new Map();
    this.lastCleanup = Date.now();
    this.cleanupInterval = options.cleanupInterval ?? 30 * 60 * 1000; // 30 minutos por defecto
    this.enableLogging = options.enableLogging ?? false;
  }

  /**
   * obtiene una instancia de caché (singleton por nombre)
   */
  public static getInstance<T = any>(
    name: string = "default",
    options?: LocalCacheConfig
  ): LocalCache<T> {
    if (!LocalCache.instances.has(name)) {
      LocalCache.instances.set(name, new LocalCache<T>(options));
    }
    return LocalCache.instances.get(name) as LocalCache<T>;
  }

  /**
   * obtiene un item del caché
   */
  public get(key: string): T | undefined {
    this.cleanup();
    const item = this.cache.get(key);

    if (item) {
      // verificar si el item ha expirado
      const now = Math.floor(Date.now() / 1000);
      if (item.ttl && item.ttl < now) {
        this.cache.delete(key);
        return undefined;
      }

      if (this.enableLogging) {
        console.log(`CACHE HIT: ${key}`);
      }
      return item.value;
    }

    return undefined;
  }

  /**
   * guarda un item en el caché
   */
  public set(key: string, value: T, ttlSeconds?: number): void {
    this.cleanup();

    const item: CacheItem<T> = {
      key,
      value,
      ttl: ttlSeconds ? Math.floor(Date.now() / 1000) + ttlSeconds : undefined,
    };

    this.cache.set(key, item);
  }

  /**
   * busca items por prefijo
   */
  public query(prefix: string): T[] {
    this.cleanup();
    const now = Math.floor(Date.now() / 1000);
    const results: T[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (key.startsWith(prefix)) {
        // verificar ttl
        if (!item.ttl || item.ttl >= now) {
          results.push(item.value);
        } else {
          this.cache.delete(key);
        }
      }
    }

    if (this.enableLogging && results.length > 0) {
      console.log(`CACHE QUERY HITS [${results.length}]: ${prefix}`);
    }

    return results;
  }

  /**
   * guarda múltiples items
   */
  public setMany(items: Array<{ key: string; value: T; ttl?: number }>): void {
    items.forEach((item) => this.set(item.key, item.value, item.ttl));
  }

  /**
   * obtiene múltiples items por keys
   */
  public getMany(keys: string[]): Map<string, T> {
    const results = new Map<string, T>();
    keys.forEach((key) => {
      const value = this.get(key);
      if (value !== undefined) {
        results.set(key, value);
      }
    });
    return results;
  }

  /**
   * elimina un item del caché
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * limpia todo el caché
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * obtiene el tamaño del caché
   */
  public size(): number {
    this.cleanup();
    return this.cache.size;
  }

  /**
   * verifica si existe una key
   */
  public has(key: string): boolean {
    const value = this.get(key);
    return value !== undefined;
  }

  /**
   * obtiene todas las keys
   */
  public keys(): string[] {
    this.cleanup();
    return Array.from(this.cache.keys());
  }

  /**
   * limpia items expirados
   */
  private cleanup(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.cleanupInterval) return;

    const nowSeconds = Math.floor(now / 1000);
    let removed = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.ttl && item.ttl < nowSeconds) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (this.enableLogging && removed > 0) {
      console.log(`CACHE CLEANUP: Removed ${removed} expired items`);
    }

    this.lastCleanup = now;
  }
}

// interfaces
export interface LocalCacheConfig {
  cleanupInterval?: number; // intervalo de limpieza en ms
  enableLogging?: boolean; // habilitar logs
}

export interface CacheItem<T> {
  key: string;
  value: T;
  ttl?: number; // tiempo de expiración en segundos unix
}
