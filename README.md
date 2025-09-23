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

### Automated Publishing (GitHub Actions)

Both registries are handled automatically by separate workflows when you push to `main`:

1. **npm Registry** (`publish-npm.yml`)
   - Automatically applies changesets and versions packages
   - Publishes new versions directly to npm
   - Commits version updates back to main branch
   - Requires `NPM_TOKEN` secret in GitHub

2. **GitHub Packages** (`publish-github.yml`)
   - Runs when package.json files change
   - Publishes any new versions to GitHub Packages
   - Skips already published versions
   - Uses built-in `GITHUB_TOKEN`

### Setup Required

Add `NPM_TOKEN` secret to your GitHub repository:
1. Get token from [npmjs.com](https://www.npmjs.com/settings/~/tokens)
2. Add to GitHub repo: Settings → Secrets → Actions → New repository secret

### Development Workflow

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

### Manual Publishing (if needed)

```bash
# Login to npm
npm login

# Create changeset and update versions
pnpm changeset
pnpm run version

# Publish to npm
pnpm release
```

## License

All packages licensed under CC BY-NC-ND 4.0. Third-party dependencies apply.
