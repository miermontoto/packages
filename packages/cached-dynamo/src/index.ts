import {
  DynamoItem,
  DynamoWrapper,
  QueryOptions,
  UpdateOptions,
} from "@miermontoto/dynamo";
import { LocalCache } from "@miermontoto/local-cache";
import { extractKeys, generateCacheKey } from "./helpers";
import { CacheConfig, CachedDynamoConfig } from "./interfaces";

/**
 * wrapper de dynamodb con caché local en memoria
 * combina @miermontoto/dynamo con @miermontoto/local-cache
 */
export class CachedDynamoWrapper extends DynamoWrapper {
  private readonly cache: LocalCache;
  private readonly cacheConfig: CacheConfig;
  protected readonly partitionKey: string;
  protected readonly sortKey?: string;

  constructor(config: CachedDynamoConfig) {
    super(config);

    this.partitionKey = config.partitionKey;
    this.sortKey = config.sortKey;

    // configurar caché
    this.cacheConfig = {
      enabled: config.cache?.enabled ?? true,
      prefix: config.cache?.prefix ?? `${config.tableName}:`,
      ttl: config.cache?.ttl,
      instanceName: config.cache?.instanceName ?? config.tableName,
    };

    // obtener instancia de caché con prefijo configurado
    this.cache = LocalCache.getInstance(this.cacheConfig.instanceName, {
      prefix: this.cacheConfig.prefix,
    });
  }

  /**
   * genera la clave de caché para un item (el prefijo lo maneja LocalCache)
   */
  private getCacheKey(
    partitionValue: string | number,
    sortValue?: string | number
  ): string {
    return generateCacheKey(partitionValue, sortValue);
  }

  /**
   * obtiene un item con caché
   */
  async get<T extends DynamoItem>(
    partitionValue: string | number,
    sortValue?: string | number
  ): Promise<T | null> {
    const cacheKey = this.getCacheKey(partitionValue, sortValue);

    // buscar en caché local si está habilitado
    if (this.cacheConfig.enabled) {
      const cachedItem = this.cache.get(cacheKey) as T;
      if (cachedItem) {
        return cachedItem;
      }
    }

    // buscar en dynamodb
    const item = await super.get<T>(partitionValue, sortValue);

    // guardar en caché si existe y está habilitado
    if (item && this.cacheConfig.enabled) {
      this.cache.set(cacheKey, item, this.cacheConfig.ttl);
    }

    return item;
  }

  /**
   * guarda un item en dynamodb y caché
   */
  async put<T extends DynamoItem>(item: T): Promise<boolean> {
    // guardar en dynamodb
    const success = await super.put(item);

    // guardar en caché si está habilitado y fue exitoso
    if (success && this.cacheConfig.enabled) {
      const { partitionValue, sortValue } = extractKeys(
        item,
        this.partitionKey,
        this.sortKey
      );
      const cacheKey = this.getCacheKey(partitionValue, sortValue);
      this.cache.set(cacheKey, item, this.cacheConfig.ttl);
    }

    return success;
  }

  /**
   * actualiza un item en dynamodb e invalida caché
   */
  async update<T extends DynamoItem>(
    partitionValue: string | number,
    sortValue: string | number | undefined,
    attributes: Partial<T>,
    options?: UpdateOptions
  ): Promise<boolean> {
    // actualizar en dynamodb
    const success = await super.update(
      partitionValue,
      sortValue,
      attributes,
      options
    );

    // invalidar caché si está habilitado y fue exitoso
    if (success && this.cacheConfig.enabled) {
      const cacheKey = this.getCacheKey(partitionValue, sortValue);
      this.cache.delete(cacheKey);
    }

    return success;
  }

  /**
   * elimina un item de dynamodb y caché
   */
  async delete(
    partitionValue: string | number,
    sortValue?: string | number
  ): Promise<boolean> {
    // eliminar de dynamodb
    const success = await super.delete(partitionValue, sortValue);

    // eliminar de caché si está habilitado
    if (this.cacheConfig.enabled) {
      const cacheKey = this.getCacheKey(partitionValue, sortValue);
      this.cache.delete(cacheKey);
    }

    return success;
  }

  /**
   * query con caché por prefijo
   */
  async query<T extends DynamoItem>(
    partitionValue: string | number,
    options?: QueryOptions
  ): Promise<T[]> {
    // el prefijo de tabla lo maneja automáticamente LocalCache
    const cachePrefix = `${partitionValue}`;

    // buscar en caché local si está habilitado y no hay opciones complejas
    if (
      this.cacheConfig.enabled &&
      !options?.filterExpression &&
      !options?.indexName
    ) {
      const cachedItems = this.cache.query(cachePrefix) as T[];
      if (cachedItems.length > 0) {
        // aplicar límite si existe
        if (options?.limit) {
          return cachedItems.slice(0, options.limit);
        }
        return cachedItems;
      }
    }

    // buscar en dynamodb
    const items = await super.query<T>(partitionValue, options);

    // guardar en caché si está habilitado y es una query simple
    if (
      items.length > 0 &&
      this.cacheConfig.enabled &&
      !options?.filterExpression &&
      !options?.indexName
    ) {
      items.forEach((item) => {
        const { partitionValue: pv, sortValue: sv } = extractKeys(
          item,
          this.partitionKey,
          this.sortKey
        );
        const cacheKey = this.getCacheKey(pv, sv);
        this.cache.set(cacheKey, item, this.cacheConfig.ttl);
      });
    }

    return items;
  }

  /**
   * obtiene múltiples items con caché
   */
  async batchGet<T extends DynamoItem>(
    keys: Array<{ [key: string]: string | number }>
  ): Promise<T[]> {
    const results: T[] = [];
    const missingKeys: Array<{ [key: string]: string | number }> = [];

    // buscar en caché primero si está habilitado
    if (this.cacheConfig.enabled) {
      for (const key of keys) {
        const partitionValue = key[this.partitionKey];
        const sortValue = this.sortKey ? key[this.sortKey] : undefined;
        const cacheKey = this.getCacheKey(partitionValue, sortValue);
        const cached = this.cache.get(cacheKey) as T;

        if (cached) {
          results.push(cached);
        } else {
          missingKeys.push(key);
        }
      }
    } else {
      missingKeys.push(...keys);
    }

    // buscar items faltantes en dynamodb
    if (missingKeys.length > 0) {
      const dynamoItems = await super.batchGet<T>(missingKeys);

      // guardar en caché si está habilitado
      if (this.cacheConfig.enabled) {
        dynamoItems.forEach((item) => {
          const { partitionValue, sortValue } = extractKeys(
            item,
            this.partitionKey,
            this.sortKey
          );
          const cacheKey = this.getCacheKey(partitionValue, sortValue);
          this.cache.set(cacheKey, item, this.cacheConfig.ttl);
        });
      }

      results.push(...dynamoItems);
    }

    return results;
  }

  /**
   * guarda múltiples items en dynamodb y caché
   */
  async batchPut<T extends DynamoItem>(items: T[]): Promise<boolean> {
    // guardar en dynamodb
    const success = await super.batchPut(items);

    // guardar en caché si está habilitado y fue exitoso
    if (success && this.cacheConfig.enabled) {
      items.forEach((item) => {
        const { partitionValue, sortValue } = extractKeys(
          item,
          this.partitionKey,
          this.sortKey
        );
        const cacheKey = this.getCacheKey(partitionValue, sortValue);
        this.cache.set(cacheKey, item, this.cacheConfig.ttl);
      });
    }

    return success;
  }

  /**
   * elimina múltiples items de dynamodb y caché
   */
  async batchDelete(
    keys: Array<{ [key: string]: string | number }>
  ): Promise<boolean> {
    // eliminar de dynamodb
    const success = await super.batchDelete(keys);

    // eliminar de caché si está habilitado
    if (this.cacheConfig.enabled) {
      keys.forEach((key) => {
        const partitionValue = key[this.partitionKey];
        const sortValue = this.sortKey ? key[this.sortKey] : undefined;
        const cacheKey = this.getCacheKey(partitionValue, sortValue);
        this.cache.delete(cacheKey);
      });
    }

    return success;
  }

  /**
   * limpia todo el caché local
   */
  clearCache(): void {
    if (this.cacheConfig.enabled) {
      this.cache.clear();
    }
  }

  /**
   * obtiene el tamaño del caché
   */
  getCacheSize(): number {
    return this.cacheConfig.enabled ? this.cache.size() : 0;
  }

  /**
   * habilita o deshabilita el caché
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheConfig.enabled = enabled;
  }

  /**
   * verifica si el caché está habilitado
   */
  isCacheEnabled(): boolean {
    return this.cacheConfig.enabled;
  }
}

export * from "./helpers";
export * from "./interfaces";
