# @miermontoto/packages

TypeScript package collection for Node.js applications. framework-agnostic utilities and wrappers.

## Packages

| Package | Description | NPM |
|---------|-------------|-----|
| [@miermontoto/cached-dynamo](./packages/cached-dynamo) | DynamoDB client with built-in memory caching for improved performance | [npm](https://www.npmjs.com/package/@miermontoto/cached-dynamo) |
| [@miermontoto/config](./packages/config) | Configuration management with AWS Secrets Manager and environment variables | [npm](https://www.npmjs.com/package/@miermontoto/config) |
| [@miermontoto/dynamo](./packages/dynamo) | TypeScript wrapper for common DynamoDB operations with promise support | [npm](https://www.npmjs.com/package/@miermontoto/dynamo) |
| [@miermontoto/lambda-handler](./packages/lambda-handler) | Base handler class for AWS Lambda with middleware support and health checks | [npm](https://www.npmjs.com/package/@miermontoto/lambda-handler) |
| [@miermontoto/lambda-responses](./packages/lambda-responses) | Consistent HTTP response helpers for AWS Lambda functions | [npm](https://www.npmjs.com/package/@miermontoto/lambda-responses) |
| [@miermontoto/local-cache](./packages/local-cache) | In-memory cache implementation with TTL and automatic cleanup | [npm](https://www.npmjs.com/package/@miermontoto/local-cache) |
| [@miermontoto/okticket](./packages/okticket) | TypeScript client for Okticket API - B2B expense automation and management platform integration | [npm](https://www.npmjs.com/package/@miermontoto/okticket) |
| [@miermontoto/redis](./packages/redis) | TypeScript wrapper for Redis-optimized operations | [npm](https://www.npmjs.com/package/@miermontoto/redis) |
| [@miermontoto/s3](./packages/s3) | TypeScript wrapper for AWS S3 operations with streaming support | [npm](https://www.npmjs.com/package/@miermontoto/s3) |
| [@miermontoto/ses](./packages/ses) | Simple TypeScript wrapper for AWS SES operations | [npm](https://www.npmjs.com/package/@miermontoto/ses) |
| [@miermontoto/sns](./packages/sns) | Simple TypeScript wrapper for AWS SNS operations | [npm](https://www.npmjs.com/package/@miermontoto/sns) |
| [@miermontoto/zip](./packages/zip) | ZIP archive creation and extraction using archiver library | [npm](https://www.npmjs.com/package/@miermontoto/zip) |

## Installation

### npm (recommended)

```bash
# install individual packages
pnpm add @miermontoto/s3
pnpm add @miermontoto/dynamo
pnpm add @miermontoto/lambda-handler
# etc...
```

### GitHub Packages

to install from GitHub Packages, you'll need to:

1. Create a GitHub Personal Access Token with `read:packages` scope
2. Configure npm to use GitHub Packages for `@miermontoto` scope:

```bash
# Add to your ~/.npmrc or project .npmrc
@miermontoto:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

3. Install packages normally:

```bash
pnpm add @miermontoto/s3
pnpm add @miermontoto/dynamo
# etc...
```

## Development

this is a pnpm workspace monorepo. to work on packages:

```bash
# install dependencies
pnpm install

# build all packages
pnpm -r build

# build specific package
pnpm --filter @miermontoto/s3 build
```

## Publishing

```bash
# 1. Create a changeset for version bumps
pnpm changeset

# 2. Commit and push (including the changeset)
git add .
git commit -m "feat: new feature"
git push

# The CI will automatically:
# - Apply version bumps from changesets
# - Commit the version updates back to main
# - Publish to npm registry
# - Publish to GitHub Packages
# - No PR or manual approval needed
```

## License

all packages licensed under CC BY-NC-ND 4.0. third-party dependencies apply.