export interface LocalCacheConfig {
  cleanupInterval?: number; // intervalo de limpieza en ms
  enableLogging?: boolean; // habilitar logs
  prefix?: string; // prefijo opcional para todas las claves
}

export interface CacheItem<T> {
  key: string;
  value: T;
  ttl?: number; // tiempo de expiración en segundos unix
}
