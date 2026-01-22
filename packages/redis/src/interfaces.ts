import type { RedisOptions } from 'ioredis';

export interface RedisConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  /** tiempo de expiración por defecto en segundos */
  defaultTtl?: number;
  /** opciones adicionales de ioredis */
  options?: Partial<RedisOptions>;
}

export interface SetOptions {
  /** tiempo de expiración en segundos */
  ttl?: number;
  /** solo setear si no existe */
  nx?: boolean;
  /** solo setear si ya existe */
  xx?: boolean;
}

export interface ScanOptions {
  /** patrón de búsqueda (ej: 'user:*') */
  pattern?: string;
  /** cantidad de elementos por iteración */
  count?: number;
}
