# @miermontoto/cached-dynamo

[![npm](https://img.shields.io/npm/v/@miermontoto/cached-dynamo)](https://www.npmjs.com/package/@miermontoto/cached-dynamo)

DynamoDB wrapper with built-in local memory caching, combining @miermontoto/dynamo and @miermontoto/local-cache.

## Installation

```bash
pnpm add @miermontoto/cached-dynamo
```

## Configuration

```typescript
interface CachedDynamoConfig extends DynamoWrapperConfig {
  cache?: {
    enabled?: boolean;      // enable/disable cache, default true
    prefix?: string;        // cache key prefix, defaults to table name
    ttl?: number;          // TTL in seconds for cached items
    instanceName?: string;  // cache instance name, defaults to table name
  };
}
```

## Usage

```typescript
import { CachedDynamoWrapper } from '@miermontoto/cached-dynamo';

// initialize with cache
const dynamo = new CachedDynamoWrapper({
  tableName: 'my-table',
  partitionKey: 'userId',
  sortKey: 'timestamp',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  cache: {
    enabled: true,
    prefix: 'users',
    ttl: 300, // 5 minutes
    instanceName: 'user-cache',
  },
});

// get item (checks cache first, then DynamoDB)
const user = await dynamo.get('user-123', 1234567890);

// put item (saves to both DynamoDB and cache)
await dynamo.put({
  userId: 'user-123',
  timestamp: Date.now(),
  name: 'John Doe',
});

// query with automatic cache population
const userItems = await dynamo.query('user-123');

// batch operations with cache optimization
const items = await dynamo.batchGet([
  { userId: 'user-123', timestamp: 1234567890 },
  { userId: 'user-456', timestamp: 1234567891 },
]);

// cache management
dynamo.clearCache();              // clear all cached items
dynamo.getCacheSize();            // get number of cached items
dynamo.setCacheEnabled(false);    // disable cache temporarily
dynamo.isCacheEnabled();          // check if cache is enabled
```

## Features

- **Automatic caching**: Transparently caches DynamoDB responses
- **TTL support**: Configure expiration time for cached items
- **Query optimization**: Caches query results by prefix
- **Batch optimization**: Checks cache before making batch requests
- **Cache invalidation**: Automatically invalidates cache on updates/deletes
- **Multiple instances**: Support for different cache instances per table

## License

CC BY-NC-ND 4.0