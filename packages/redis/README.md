# @miermontoto/redis

[![npm](https://img.shields.io/npm/v/@miermontoto/redis)](https://www.npmjs.com/package/@miermontoto/redis)

TypeScript wrapper for Redis operations with Lambda optimization. Handles connection pooling, JSON serialization, and common Redis operations with built-in retry logic.

## Installation

```bash
pnpm add @miermontoto/redis
```

## Configuration

```typescript
interface RedisConfig {
  host?: string;       // defaults to REDIS_HOST env or 'localhost'
  port?: number;       // defaults to REDIS_PORT env or 6379
  password?: string;   // defaults to REDIS_PASSWORD env
  db?: number;         // defaults to 0
  keyPrefix?: string;  // prefix for all keys
  defaultTtl?: number; // default expiration in seconds
}
```

## Usage

```typescript
import { Redis } from '@miermontoto/redis';

// singleton instance (recommended for Lambda)
const redis = Redis.getInstance({
  host: 'localhost',
  port: 6379,
});

// basic operations
await redis.set('key', 'value');
await redis.set('key', 'value', { ttl: 3600 }); // with expiration
const value = await redis.get('key');

// json operations
await redis.setJson('user:1', { name: 'John', age: 30 });
const user = await redis.getJson<User>('user:1');

// check existence
const exists = await redis.exists('key');

// delete keys
await redis.del('key1', 'key2');

// increment/decrement
await redis.incr('counter');
await redis.incrBy('counter', 5);

// hash operations
await redis.hset('hash', 'field', 'value');
const field = await redis.hget('hash', 'field');
const all = await redis.hgetall('hash');

// list operations
await redis.rpush('list', 'a', 'b', 'c');
const items = await redis.lrange('list', 0, -1);

// set operations
await redis.sadd('set', 'member1', 'member2');
const members = await redis.smembers('set');

// scan keys (efficient for large datasets)
const keys = await redis.scan({ pattern: 'user:*' });

// health check
const healthy = await redis.ping();

// close connection
await redis.close();
// or close all singleton instances
await Redis.closeAll();
```

## Lambda Optimization

The singleton pattern reuses connections across Lambda invocations:

```typescript
// handler.ts
import { Redis } from '@miermontoto/redis';

// connection is reused while container is warm
const redis = Redis.getInstance();

export async function handler(event: any) {
  const value = await redis.get('key');
  return { statusCode: 200, body: value };
}
```

## License

CC BY-NC-ND 4.0
