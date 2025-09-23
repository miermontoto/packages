# @miermontoto/s3

[![npm](https://img.shields.io/npm/v/@miermontoto/s3)](https://www.npmjs.com/package/@miermontoto/s3)

TypeScript wrapper for AWS S3 operations with streaming support. Handles file uploads, downloads, listing, deletion, and existence checks with built-in error handling and retry logic.

## Installation

```bash
pnpm add @miermontoto/s3
```

## Configuration

```typescript
interface S3WrapperConfig {
  bucket: string;
  region?: string;  // defaults to AWS_REGION env or 'us-east-1'
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
  }
}
```

## Usage

```typescript
import { S3Wrapper } from '@miermontoto/s3';

// initialize client
const s3 = new S3Wrapper({
  bucket: 'my-bucket',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// upload file
await s3.upload('file.txt', 'Hello World');

// download file
const content = await s3.download('file.txt');

// check existence
const exists = await s3.exists('file.txt');

// list files
const files = await s3.list({ prefix: 'documents/' });

// delete file
await s3.delete('file.txt');
```

## License

CC BY-NC-ND 4.0