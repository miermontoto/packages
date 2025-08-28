# @miermontoto/packages

TypeScript packages collection for Node.js applications. Framework-agnostic utilities and wrappers.

## Packages

| Package | Description |
|---------|-------------|
| [@miermontoto/s3](./packages/s3) | Simple TypeScript wrapper for AWS S3 operations |
| [@miermontoto/zip](./packages/zip) | Simple TypeScript wrapper for ZIP operations using archiver |

## Installation

```bash
# install individual packages
pnpm add @miermontoto/s3
pnpm add @miermontoto/zip
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

```bash
# login to npm if not already logged in
npm login
```

### Build Packages

```bash
# build all packages
pnpm -r build

# or build individually
pnpm --filter <package-name> build
```

### Publish with Changesets (Recommended)

```bash
# create a changeset for version bumps
pnpm changeset
# - select packages to release
# - choose version bump type (patch/minor/major)
# - add a summary of changes

# update versions based on changesets
pnpm version

# build and publish all packages
pnpm release
```

### Direct Publishing (Individual Packages)

```bash
# publish individual package
pnpm --filter <package-name> publish

# for first-time publishing of scoped packages
pnpm --filter <package-name> publish --access public
```

## License

All packages licensed under CC BY-NC-ND 4.0. Third-party dependencies apply.