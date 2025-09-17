export interface S3WrapperConfig {
  bucket: string;
  region?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
  }
}
