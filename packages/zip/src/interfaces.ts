export interface ZipWrapperConfig {
  compressionLevel?: number; // 0-9, default 9
}

export interface ZipEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  compressedSize: number;
}

export interface ExtractedFile {
  name: string;
  path: string;
  content: Buffer;
  size: number;
}

export interface ExtractOptions {
  filter?: (entry: ZipEntry) => boolean;
  extensions?: string[];
}