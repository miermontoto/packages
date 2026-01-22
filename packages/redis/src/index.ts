import IORedis, { RedisOptions } from 'ioredis';
import { RedisConfig, SetOptions, ScanOptions } from './interfaces';

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 6379;
const DEFAULT_DB = 0;
const MAX_RETRIES = 3;

/**
 * wrapper simple para operaciones redis con optimizaciones para lambda
 */
export class Redis {
  private client: IORedis | null = null;
  private readonly config: RedisConfig;
  private static instances: Map<string, Redis> = new Map();

  constructor(config: RedisConfig = {}) {
    this.config = {
      host: config.host ?? process.env.REDIS_HOST ?? DEFAULT_HOST,
      port: config.port ?? parseInt(process.env.REDIS_PORT || String(DEFAULT_PORT), 10),
      password: config.password ?? process.env.REDIS_PASSWORD,
      db: config.db ?? DEFAULT_DB,
      keyPrefix: config.keyPrefix,
      defaultTtl: config.defaultTtl,
      options: config.options,
    };
  }

  /**
   * obtiene o crea una instancia singleton por configuración
   * útil para reutilizar conexiones en lambda
   */
  static getInstance(config: RedisConfig = {}): Redis {
    const key = `${config.host ?? 'default'}:${config.port ?? DEFAULT_PORT}:${config.db ?? DEFAULT_DB}`;

    if (!Redis.instances.has(key)) {
      Redis.instances.set(key, new Redis(config));
    }

    return Redis.instances.get(key)!;
  }

  /**
   * obtiene el cliente ioredis (crea la conexión si no existe)
   */
  getClient(): IORedis {
    if (this.client) {
      return this.client;
    }

    const options: RedisOptions = {
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      // optimizaciones para lambda
      maxRetriesPerRequest: MAX_RETRIES,
      retryStrategy: (times: number): number | null => {
        if (times > MAX_RETRIES) return null;
        return Math.min(times * 100, 500);
      },
      enableReadyCheck: true,
      lazyConnect: false,
      ...this.config.options,
    };

    this.client = new IORedis(options);
    return this.client;
  }

  /**
   * cierra la conexión
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  /**
   * cierra todas las instancias singleton
   */
  static async closeAll(): Promise<void> {
    for (const instance of Redis.instances.values()) {
      await instance.close();
    }
    Redis.instances.clear();
  }

  /**
   * verifica la conexión
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.getClient().ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * obtiene un valor
   */
  async get(key: string): Promise<string | null> {
    return await this.getClient().get(key);
  }

  /**
   * obtiene un valor parseado como json
   */
  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  /**
   * setea un valor
   */
  async set(key: string, value: string, options?: SetOptions): Promise<boolean> {
    const client = this.getClient();
    const ttl = options?.ttl ?? this.config.defaultTtl;

    const args: (string | number)[] = [key, value];

    if (ttl) {
      args.push('EX', ttl);
    }

    if (options?.nx) {
      args.push('NX');
    } else if (options?.xx) {
      args.push('XX');
    }

    const result = await client.set(...(args as [string, string, ...any[]]));
    return result === 'OK';
  }

  /**
   * setea un valor como json
   */
  async setJson<T>(key: string, value: T, options?: SetOptions): Promise<boolean> {
    return await this.set(key, JSON.stringify(value), options);
  }

  /**
   * elimina una o más keys
   */
  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return await this.getClient().del(...keys);
  }

  /**
   * verifica si una key existe
   */
  async exists(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return await this.getClient().exists(...keys);
  }

  /**
   * setea tiempo de expiración
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.getClient().expire(key, seconds);
    return result === 1;
  }

  /**
   * obtiene el ttl de una key
   */
  async ttl(key: string): Promise<number> {
    return await this.getClient().ttl(key);
  }

  /**
   * incrementa un valor numérico
   */
  async incr(key: string): Promise<number> {
    return await this.getClient().incr(key);
  }

  /**
   * incrementa un valor numérico por n
   */
  async incrBy(key: string, increment: number): Promise<number> {
    return await this.getClient().incrby(key, increment);
  }

  /**
   * decrementa un valor numérico
   */
  async decr(key: string): Promise<number> {
    return await this.getClient().decr(key);
  }

  /**
   * obtiene múltiples valores
   */
  async mget(...keys: string[]): Promise<(string | null)[]> {
    if (keys.length === 0) return [];
    return await this.getClient().mget(...keys);
  }

  /**
   * setea múltiples valores
   */
  async mset(data: Record<string, string>): Promise<boolean> {
    const entries = Object.entries(data);
    if (entries.length === 0) return true;

    const args = entries.flat();
    const result = await this.getClient().mset(...args);
    return result === 'OK';
  }

  /**
   * obtiene el número de keys en la db
   */
  async dbsize(): Promise<number> {
    return await this.getClient().dbsize();
  }

  /**
   * limpia toda la db actual
   */
  async flushdb(): Promise<boolean> {
    const result = await this.getClient().flushdb();
    return result === 'OK';
  }

  /**
   * busca keys por patrón
   */
  async keys(pattern: string): Promise<string[]> {
    return await this.getClient().keys(pattern);
  }

  /**
   * escanea keys de forma eficiente (para grandes datasets)
   */
  async scan(options: ScanOptions = {}): Promise<string[]> {
    const client = this.getClient();
    const pattern = options.pattern ?? '*';
    const count = options.count ?? 100;
    const keys: string[] = [];

    let cursor = '0';
    do {
      const [nextCursor, results] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
      cursor = nextCursor;
      keys.push(...results);
    } while (cursor !== '0');

    return keys;
  }

  /**
   * ejecuta comandos en pipeline (más eficiente para múltiples operaciones)
   */
  pipeline(): IORedis['pipeline'] {
    return this.getClient().pipeline.bind(this.getClient());
  }

  /**
   * setea un campo en un hash
   */
  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.getClient().hset(key, field, value);
  }

  /**
   * obtiene un campo de un hash
   */
  async hget(key: string, field: string): Promise<string | null> {
    return await this.getClient().hget(key, field);
  }

  /**
   * obtiene todos los campos de un hash
   */
  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.getClient().hgetall(key);
  }

  /**
   * elimina campos de un hash
   */
  async hdel(key: string, ...fields: string[]): Promise<number> {
    if (fields.length === 0) return 0;
    return await this.getClient().hdel(key, ...fields);
  }

  /**
   * añade elementos a una lista (por la derecha)
   */
  async rpush(key: string, ...values: string[]): Promise<number> {
    if (values.length === 0) return 0;
    return await this.getClient().rpush(key, ...values);
  }

  /**
   * añade elementos a una lista (por la izquierda)
   */
  async lpush(key: string, ...values: string[]): Promise<number> {
    if (values.length === 0) return 0;
    return await this.getClient().lpush(key, ...values);
  }

  /**
   * obtiene elementos de una lista
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return await this.getClient().lrange(key, start, stop);
  }

  /**
   * obtiene la longitud de una lista
   */
  async llen(key: string): Promise<number> {
    return await this.getClient().llen(key);
  }

  /**
   * añade miembros a un set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (members.length === 0) return 0;
    return await this.getClient().sadd(key, ...members);
  }

  /**
   * obtiene todos los miembros de un set
   */
  async smembers(key: string): Promise<string[]> {
    return await this.getClient().smembers(key);
  }

  /**
   * verifica si un miembro está en un set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.getClient().sismember(key, member);
    return result === 1;
  }

  /**
   * obtiene el número de miembros en un set
   */
  async scard(key: string): Promise<number> {
    return await this.getClient().scard(key);
  }
}

export * from './interfaces';
