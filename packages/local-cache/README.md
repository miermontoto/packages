# @miermontoto/local-cache

[![npm](https://img.shields.io/npm/v/@miermontoto/local-cache)](https://www.npmjs.com/package/@miermontoto/local-cache)

In-memory cache implementation with TTL and automatic cleanup. Features include batch operations, prefix queries, named instances, and memory-efficient storage with periodic garbage collection.

## Installation

```bash
pnpm add @miermontoto/local-cache
```

## Configuration

```typescript
interface LocalCacheConfig {
  cleanupInterval?: number; // cleanup interval in ms, default 30 minutes
  enableLogging?: boolean; // enable cache hit/miss logs, default false
}
```

## Usage

```typescript
import { LocalCache } from '@miermontoto/local-cache';

// get singleton instance
const cache = LocalCache.getInstance();

// set item with 60 seconds ttl
cache.set('user:123', { name: 'John', age: 30 }, 60);

// get item
const user = cache.get('user:123');

// query by prefix
const allUsers = cache.query('user:');

// batch operations
cache.setMany([
  { key: 'config:api', value: { url: 'https://api.example.com' }, ttl: 3600 },
  { key: 'config:timeout', value: 5000, ttl: 3600 }
]);

// check existence
if (cache.has('user:123')) {
  console.log('User exists in cache');
}

// delete item
cache.delete('user:123');

// clear all
cache.clear();
```

## Multiple Cache Instances

```typescript
// create named instances for different purposes
const userCache = LocalCache.getInstance('users', { enableLogging: true });
const configCache = LocalCache.getInstance('config', { cleanupInterval: 60000 });

// each instance maintains its own storage
userCache.set('john', { id: 1 });
configCache.set('timeout', 5000);
```

## License

CC BY-NC-ND 4.0