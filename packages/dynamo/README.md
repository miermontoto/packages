# @miermontoto/dynamo

[![npm](https://img.shields.io/npm/v/@miermontoto/dynamo)](https://www.npmjs.com/package/@miermontoto/dynamo)

TypeScript wrapper for common DynamoDB operations with promise support. Provides a clean API for CRUD operations, queries, scans, and batch processing with automatic retries and connection pooling.

## Installation

```bash
pnpm add @miermontoto/dynamo
```

## Configuration

```typescript
interface DynamoWrapperConfig {
  tableName: string;
  partitionKey: string;
  sortKey?: string;
  region?: string;  // defaults to AWS_REGION env or 'us-east-1'
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  clientOptions?: {
    maxAttempts?: number;      // default 3
    connectionTimeout?: number; // default 5000ms
    socketTimeout?: number;     // default 60000ms
    maxSockets?: number;        // default 100
  };
}
```

## Usage

```typescript
import { DynamoWrapper } from '@miermontoto/dynamo';

// initialize client
const dynamo = new DynamoWrapper({
  tableName: 'my-table',
  partitionKey: 'userId',
  sortKey: 'timestamp',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// get item
const user = await dynamo.get('user-123', 1234567890);

// put item
await dynamo.put({
  userId: 'user-123',
  timestamp: Date.now(),
  name: 'John Doe',
  email: 'john@example.com',
});

// query by partition key
const userItems = await dynamo.query('user-123', {
  keyConditionExpression: 'timestamp > :start',
  expressionValues: { ':start': 1234567000 },
  limit: 10,
});

// update item
await dynamo.update('user-123', 1234567890, {
  name: 'Jane Doe',
  updatedAt: Date.now(),
});

// batch operations
const items = await dynamo.batchGet([
  { userId: 'user-123', timestamp: 1234567890 },
  { userId: 'user-456', timestamp: 1234567891 },
]);

// delete item
await dynamo.delete('user-123', 1234567890);
```

## License

CC BY-NC-ND 4.0