export interface LocalCacheConfig {
  cleanupInterval?: number; // intervalo de limpieza en ms
  enableLogging?: boolean; // habilitar logs
}

export interface CacheItem<T> {
  key: string;
  value: T;
  ttl?: number; // tiempo de expiración en segundos unix
}
