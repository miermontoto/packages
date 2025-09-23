# @miermontoto/packages

TypeScript packages collection for Node.js applications. Framework-agnostic utilities and wrappers.

## Packages

| Package | Description | NPM |
|---------|-------------|-----|
| [@miermontoto/cached-dynamo](./packages/cached-dynamo) | DynamoDB wrapper with built-in local memory caching | [npm](https://www.npmjs.com/package/@miermontoto/cached-dynamo) |
| [@miermontoto/dynamo](./packages/dynamo) | Simple TypeScript wrapper for AWS DynamoDB operations | [npm](https://www.npmjs.com/package/@miermontoto/dynamo) |
| [@miermontoto/lambda-handler](./packages/lambda-handler) | Base handler class and utilities for AWS Lambda functions | [npm](https://www.npmjs.com/package/@miermontoto/lambda-handler) |
| [@miermontoto/lambda-responses](./packages/lambda-responses) | Standardized HTTP response helpers for AWS Lambda functions | [npm](https://www.npmjs.com/package/@miermontoto/lambda-responses) |
| [@miermontoto/local-cache](./packages/local-cache) | Simple in-memory cache with TTL support and automatic cleanup | [npm](https://www.npmjs.com/package/@miermontoto/local-cache) |
| [@miermontoto/s3](./packages/s3) | Simple TypeScript wrapper for AWS S3 operations | [npm](https://www.npmjs.com/package/@miermontoto/s3) |
| [@miermontoto/zip](./packages/zip) | Simple TypeScript wrapper for ZIP operations using archiver | [npm](https://www.npmjs.com/package/@miermontoto/zip) |

## Installation

These packages are published to both npm registry and GitHub Packages.

### From npm (recommended)

```bash
# install individual packages
pnpm add @miermontoto/s3
pnpm add @miermontoto/dynamo
pnpm add @miermontoto/lambda-handler
# etc...
```

### From GitHub Packages

To install from GitHub Packages, you'll need to:

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

For npm registry:
```bash
# login to npm if not already logged in
npm login
```

For GitHub Actions (automated publishing to both registries):
- Add `NPM_TOKEN` secret to your GitHub repository (get from npm.com)
- `GITHUB_TOKEN` is automatically provided by GitHub Actions

### Automated Publishing (via GitHub Actions)

Simply push to the `main` branch. The GitHub Actions workflow will:
1. Build all packages
2. Create a release PR with version bumps
3. Publish to **both npm and GitHub Packages** when the PR is merged

### Manual Publishing with Changesets

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
