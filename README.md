# @miermontoto/packages

TypeScript packages collection for Node.js applications. Framework-agnostic utilities and wrappers.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [@miermontoto/s3](./packages/s3) | 1.0.0 | Simple TypeScript wrapper for AWS S3 operations |
| [@miermontoto/zip](./packages/zip) | 1.0.0 | Simple TypeScript wrapper for ZIP operations using archiver |

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

Packages are published to npm registry. To publish:

```bash
# build package first
pnpm --filter <package-name> build

# publish
pnpm --filter <package-name> publish
```

## License

All packages licensed under CC BY-NC-ND 4.0. Third-party dependencies apply.