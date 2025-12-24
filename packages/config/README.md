# @miermontoto/config

[![npm](https://img.shields.io/npm/v/@miermontoto/config)](https://www.npmjs.com/package/@miermontoto/config)

Configuration management wrapper for AWS Secrets Manager with environment variable fallback. Provides a simple API for retrieving configuration values from multiple sources with built-in error handling.

## Installation

```bash
pnpm add @miermontoto/config
```

## Configuration

The package uses the following environment variable:

- `AWS_SECRET_ID`: Name of the Secrets Manager secret container holding configuration values (required).

AWS credentials are automatically loaded from the environment or IAM role.

## Usage

```typescript
import { config } from '@miermontoto/config';

// get configuration value with fallback chain:
// 1. environment variable
// 2. AWS Secrets Manager
// 3. default value
const apiKey = await config.get('API_KEY', 'default-key');

// without default value
const dbHost = await config.get('DB_HOST');

// singleton instance
import { Config } from '@miermontoto/config';
const configInstance = Config.getInstance();
```

## How it works

The `get()` method retrieves configuration values in the following order:

1. **Environment variables**: First checks `process.env[key]`
2. **AWS Secrets Manager**: If not found in env, fetches from the configured secret
3. **Default value**: Returns the provided default if not found in either source

Errors from Secrets Manager are logged but don't throw - the method falls back to the default value.

## License

CC BY-NC-ND 4.0
