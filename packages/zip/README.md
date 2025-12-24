# @miermontoto/zip

[![npm](https://img.shields.io/npm/v/@miermontoto/zip)](https://www.npmjs.com/package/@miermontoto/zip)

ZIP archive creation and extraction. Supports compression levels, directory structures, streaming for large files, glob patterns, and flexible extraction with filtering.

## Installation

```bash
pnpm add @miermontoto/zip
```

## Usage

```typescript
import { ZipWrapper } from '@miermontoto/zip';

const zip = new ZipWrapper({ compressionLevel: 9 });
```

### Creation

```typescript
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

// streaming for large files
const stream = zip.createStream();
zip.addFile(stream, 'large-file.dat', largeBuffer);
zip.addDirectory(stream, 'archive-folder', './local-folder');
zip.addGlob(stream, '**/*.js', { cwd: './src' });
await zip.finalize(stream);
```

### Extraction

```typescript
// list entries in a zip
const entries = zip.list(zipBuffer);
// [{ name, path, isDirectory, size, compressedSize }, ...]

// extract all files
const files = zip.extract(zipBuffer);
// [{ name, path, content, size }, ...]

// extract with extension filter
const xmlFiles = zip.extract(zipBuffer, { extensions: ['xml', 'pdf'] });

// extract with custom filter
const largeFiles = zip.extract(zipBuffer, {
  filter: (entry) => entry.size > 1024
});

// extract a single file by path
const file = zip.extractFile(zipBuffer, 'docs/readme.txt');

// extract to disk
zip.extractToDisk(zipBuffer, './output', true);
```

## Interfaces

```typescript
interface ZipWrapperConfig {
  compressionLevel?: number; // 0-9, default 9
}

interface ZipEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  compressedSize: number;
}

interface ExtractedFile {
  name: string;
  path: string;
  content: Buffer;
  size: number;
}

interface ExtractOptions {
  filter?: (entry: ZipEntry) => boolean;
  extensions?: string[];
}
```

## License

CC BY-NC-ND 4.0
