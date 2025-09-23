# @miermontoto/packages

TypeScript packages collection for Node.js applications. Framework-agnostic utilities and wrappers.

## Packages

| Package | Description |
|---------|-------------|
| [@miermontoto/cached-dynamo](./packages/cached-dynamo) | DynamoDB wrapper with built-in local memory caching |
| [@miermontoto/dynamo](./packages/dynamo) | Simple TypeScript wrapper for AWS DynamoDB operations |
| [@miermontoto/lambda-handler](./packages/lambda-handler) | Base handler class and utilities for AWS Lambda functions |
| [@miermontoto/lambda-responses](./packages/lambda-responses) | Standardized HTTP response helpers for AWS Lambda functions |
| [@miermontoto/local-cache](./packages/local-cache) | Simple in-memory cache with TTL support and automatic cleanup |
| [@miermontoto/s3](./packages/s3) | Simple TypeScript wrapper for AWS S3 operations |
| [@miermontoto/zip](./packages/zip) | Simple TypeScript wrapper for ZIP operations using archiver |

## Development

This is a pnpm workspace monorepo. To work on packages:

```bash
# install dependencies
pnpm install

# build all packages
pnpm -r build

# build specific package
pnpm --filter @miermontoto/s3 build
```

## Publishing

### First-time Setup

```bash
# login to npm if not already logged in
npm login
```

### Publish with Changesets (Recommended)

```bash
# create a changeset for version bumps
pnpm changeset
# - select packages to release
# - choose version bump type (patch/minor/major)
# - add a summary of changes

# update versions based on changesets
pnpm run version

# build and publish all packages
pnpm release
```

## License

All packages licensed under CC BY-NC-ND 4.0. Third-party dependencies apply.
