import archiver, { Archiver } from 'archiver';
import AdmZip from 'adm-zip';
import { Readable } from 'stream';
import { ExtractedFile, ExtractOptions, ZipEntry, ZipWrapperConfig } from './interfaces';

const DEFAULT_COMPRESSION_LEVEL = 9;

/**
 * simple wrapper for zip operations using archiver
 */
export class ZipWrapper {
  private compressionLevel: number;

  constructor(config: ZipWrapperConfig = {}) {
    this.compressionLevel = config.compressionLevel ?? DEFAULT_COMPRESSION_LEVEL;
  }

  /**
   * creates a zip archive from files and directories
   */
  async create(entries: Array<{
    name: string;
    content: Buffer | string | Readable;
  }>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: this.compressionLevel },
      });

      const chunks: Buffer[] = [];

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (err: Error) => reject(err));

      try {
        for (const entry of entries) {
          archive.append(entry.content, { name: entry.name });
        }
        
        archive.finalize();
      } catch (error) {
        reject(error as Error);
      }
    });
  }

  /**
   * creates a zip archive with directory structure
   */
  async createWithStructure(items: Array<{
    path: string;
    content: Buffer | string | Readable;
  }>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: this.compressionLevel },
      });

      const chunks: Buffer[] = [];

      archive.on('data', (chunk) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', (err: Error) => reject(err));

      try {
        for (const item of items) {
          archive.append(item.content, { name: item.path });
        }
        
        archive.finalize();
      } catch (error) {
        reject(error as Error);
      }
    });
  }

  /**
   * creates a zip stream for large files
   */
  createStream(): Archiver {
    const archive = archiver('zip', {
      zlib: { level: this.compressionLevel },
    });

    return archive;
  }

  /**
   * adds a file to a zip archive
   */
  addFile(
    archive: Archiver, 
    name: string, 
    content: Buffer | string | Readable,
    options?: {
      date?: Date;
      mode?: number;
    }
  ): void {
    archive.append(content, { 
      name,
      date: options?.date,
      mode: options?.mode,
    });
  }

  /**
   * adds a directory to a zip archive
   */
  addDirectory(
    archive: Archiver,
    directoryPath: string,
    localPath: string
  ): void {
    archive.directory(localPath, directoryPath);
  }

  /**
   * adds files from glob pattern
   */
  addGlob(
    archive: Archiver,
    pattern: string,
    options?: {
      cwd?: string;
    }
  ): void {
    archive.glob(pattern, {
      cwd: options?.cwd,
    });
  }

  /**
   * finalizes the archive
   */
  async finalize(archive: Archiver): Promise<void> {
    await archive.finalize();
  }

  /**
   * sets compression level
   */
  setCompressionLevel(level: number): void {
    if (level < 0 || level > 9) {
      throw new Error('Compression level must be between 0 and 9');
    }
    this.compressionLevel = level;
  }

  /**
   * gets current compression level
   */
  getCompressionLevel(): number {
    return this.compressionLevel;
  }

  // ============ EXTRACTION METHODS ============

  /**
   * lists entries in a zip archive
   */
  list(source: Buffer | string): ZipEntry[] {
    const zip = new AdmZip(source);
    return zip.getEntries().map((entry) => ({
      name: entry.name,
      path: entry.entryName,
      isDirectory: entry.isDirectory,
      size: entry.header.size,
      compressedSize: entry.header.compressedSize,
    }));
  }

  /**
   * extracts all files from a zip archive
   */
  extract(source: Buffer | string, options?: ExtractOptions): ExtractedFile[] {
    const zip = new AdmZip(source);
    let entries = zip.getEntries();

    // filtrar directorios
    entries = entries.filter((entry) => !entry.isDirectory);

    // filtrar por extensiones si se especifican
    if (options?.extensions?.length) {
      const exts = options.extensions.map((e) => e.toLowerCase().replace(/^\./, ''));
      entries = entries.filter((entry) => {
        const ext = entry.entryName.split('.').pop()?.toLowerCase() || '';
        return exts.includes(ext);
      });
    }

    // filtrar por función personalizada
    if (options?.filter) {
      entries = entries.filter((entry) =>
        options.filter!({
          name: entry.name,
          path: entry.entryName,
          isDirectory: entry.isDirectory,
          size: entry.header.size,
          compressedSize: entry.header.compressedSize,
        }),
      );
    }

    return entries.map((entry) => ({
      name: entry.name,
      path: entry.entryName,
      content: entry.getData(),
      size: entry.header.size,
    }));
  }

  /**
   * extracts a single file by path
   */
  extractFile(source: Buffer | string, filePath: string): ExtractedFile | null {
    const zip = new AdmZip(source);
    const entry = zip.getEntry(filePath);

    if (!entry || entry.isDirectory) return null;

    return {
      name: entry.name,
      path: entry.entryName,
      content: entry.getData(),
      size: entry.header.size,
    };
  }

  /**
   * extracts files to disk
   */
  extractToDisk(source: Buffer | string, targetPath: string, overwrite = true): void {
    const zip = new AdmZip(source);
    zip.extractAllTo(targetPath, overwrite);
  }
}

// export interfaces
export * from './interfaces';