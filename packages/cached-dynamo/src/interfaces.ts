import { DynamoWrapperConfig } from '@miermontoto/dynamo';

export interface CachedDynamoConfig extends DynamoWrapperConfig {
  cache?: {
    enabled?: boolean;
    prefix?: string;
    ttl?: number; // ttl en segundos para items en caché
    instanceName?: string; // nombre de la instancia de caché
  };
}

export interface CacheConfig {
  enabled: boolean;
  prefix: string;
  ttl?: number;
  instanceName?: string;
}