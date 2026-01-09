import { CacheItem, LocalCacheConfig } from "./interfaces";

/**
 * Implementación de caché en memoria para reducir peticiones a DynamoDB.
 * Esta memoria depende de que la lambda se mantenga activa, pero sirve para
 * reducir el coste en general.
 */
export class LocalCache<T = any> {
  private static instances: Map<string, LocalCache<any>> = new Map();
  private readonly cache: Map<string, CacheItem<T>>;
  private lastCleanup: number;
  private readonly cleanupInterval: number;
  private readonly enableLogging: boolean;
  private readonly prefix: string;

  private constructor(options: LocalCacheConfig = {}) {
    this.cache = new Map();
    this.lastCleanup = Date.now();
    this.cleanupInterval = options.cleanupInterval ?? 30 * 60 * 1000; // 30 minutos por defecto
    this.enableLogging = options.enableLogging ?? false;
    this.prefix = options.prefix ?? "";
  }

  /**
   * construye la clave completa con el prefijo si está configurado
   */
  private buildKey(key: string): string {
    return this.prefix ? `${this.prefix}${key}` : key;
  }

  /**
   * quita el prefijo de una clave para devolverla al usuario
   */
  private stripKey(fullKey: string): string {
    if (!this.prefix) return fullKey;
    return fullKey.startsWith(this.prefix)
      ? fullKey.substring(this.prefix.length)
      : fullKey;
  }

  /**
   * Obtiene una instancia de caché (singleton por nombre)
   *
   * @param name - Nombre de la instancia
   * @param options - Configuración de la instancia
   * @returns Instancia de la caché
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
   * Obtiene un item del caché local, null si no existe o está expirado
   *
   * @param key - Clave del item
   * @returns Item del caché o null si no existe o está expirado
   */
  public get(key: string): T | undefined {
    this.cleanup();
    const fullKey = this.buildKey(key);
    const item = this.cache.get(fullKey);

    if (item) {
      // verificar si el item ha expirado
      const now = Math.floor(Date.now() / 1000);
      if (item.ttl && item.ttl < now) {
        this.cache.delete(fullKey);
        return undefined;
      }

      if (this.enableLogging) {
        console.log(`CACHE HIT: ${fullKey}`);
      }
      return item.value;
    }

    return undefined;
  }

  /**
   * Guarda un item en memoria
   *
   * @param key - Clave del item
   * @param value - Valor del item. Si no se proporciona, el item se elimina de la caché
   * @param ttlSeconds - Tiempo de expiración en segundos
   */
  public set(key: string, value?: T, ttlSeconds?: number): void {
    this.cleanup();

    const fullKey = this.buildKey(key);

    if (!value) {
      this.cache.delete(fullKey);
      return;
    }

    const item: CacheItem<T> = {
      key: fullKey,
      value,
      ttl: ttlSeconds ? Math.floor(Date.now() / 1000) + ttlSeconds : undefined,
    };

    this.cache.set(fullKey, item);
  }

  /**
   * Busca items por prefijo
   *
   * @param prefix - Prefijo de la clave
   * @returns Array de items
   */
  public query(prefix: string): T[] {
    this.cleanup();
    const now = Math.floor(Date.now() / 1000);
    const results: T[] = [];
    const fullPrefix = this.buildKey(prefix);

    for (const [key, item] of this.cache.entries()) {
      if (key.startsWith(fullPrefix)) {
        // verificar ttl
        if (!item.ttl || item.ttl >= now) {
          results.push(item.value);
        } else {
          this.cache.delete(key);
        }
      }
    }

    if (this.enableLogging && results.length > 0) {
      console.log(`CACHE QUERY HITS [${results.length}]: ${fullPrefix}`);
    }

    return results;
  }

  /**
   * Guarda múltiples items en memoria
   *
   * @param items - Array de items a guardar
   */
  public setMany(items: Array<{ key: string; value: T; ttl?: number }>): void {
    items.forEach((item) => this.set(item.key, item.value, item.ttl));
  }

  /**
   * Obtiene múltiples items por keys
   *
   * @param keys - Array de keys
   * @returns Map de items
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
   * Elimina un item del caché
   *
   * @param key - Clave del item
   * @returns true si se eliminó el item, false si no existía
   */
  public delete(key: string): boolean {
    const fullKey = this.buildKey(key);
    return this.cache.delete(fullKey);
  }

  /**
   * Limpia todo el caché
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Obtiene el tamaño del caché
   */
  public size(): number {
    this.cleanup();
    return this.cache.size;
  }

  /**
   * Verifica si existe una key
   *
   * @param key - Clave del item
   * @returns true si existe el item, false si no existe
   */
  public has(key: string): boolean {
    const value = this.get(key);
    return value !== undefined;
  }

  /**
   * Obtiene todas las keys
   *
   * @returns Array de keys
   */
  public keys(): string[] {
    const entries: [string, T][] = this.entries();
    return entries.map(([key, _]) => key);
  }

  /**
   * Obtiene todos los valores del caché
   *
   * @returns Array de items
   */
  public values(): T[] {
    const entries: [string, T][] = this.entries();
    return entries.map(([_, value]) => value);
  }

  /**
   * Obtiene todos los items del caché
   *
   * @returns Array de items
   */
  public entries(): [string, T][] {
    this.cleanup();
    return Array.from(this.cache.entries()).map(([key, item]) => [
      this.stripKey(key),
      item.value,
    ]);
  }

  /**
   * Limpia items expirados. Se llama automáticamente en cada operación de
   * lectura o escritura.
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

export * from "./interfaces";
