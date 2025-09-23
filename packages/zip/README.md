# @miermontoto/zip

[![npm](https://img.shields.io/npm/v/@miermontoto/zip)](https://www.npmjs.com/package/@miermontoto/zip)

ZIP archive creation and extraction using archiver library. Supports compression levels, directory structures, streaming for large files, and glob patterns for flexible file inclusion.

## Installation

```bash
pnpm add @miermontoto/zip
```

## Configuration

```typescript
interface ZipWrapperConfig {
  compressionLevel?: number; // 0-9, default 9
}
```

## Usage

```typescript
import { ZipWrapper } from '@miermontoto/zip';

// initialize wrapper
const zip = new ZipWrapper({
  compressionLevel: 9
});

// create zip from files
const buffer = await zip.create([
  { name: 'file1.txt', content: 'Hello World' },
  { name: 'file2.txt', content: Buffer.from('Binary data') }
]);

// create zip with directory structure
const archive = await zip.createWithStructure([
  { path: 'docs/readme.txt', content: 'Documentation' },
  { path: 'src/index.js', content: 'console.log("Hello")' }
]);

// use streaming for large files
const stream = zip.createStream();
zip.addFile(stream, 'large-file.dat', largeBuffer);
zip.addDirectory(stream, 'archive-folder', './local-folder');
zip.addGlob(stream, '**/*.js', { cwd: './src' });
await zip.finalize(stream);
```

## License

CC BY-NC-ND 4.0