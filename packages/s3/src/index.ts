import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetBucketLocationCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
  type CopyObjectCommandInput,
  type DeleteObjectCommandInput,
  type GetObjectCommandInput,
  type HeadObjectCommandInput,
  type ListObjectsV2CommandInput,
  type ListObjectsV2CommandOutput,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';

import { wasSuccessful } from './helpers';
import { S3WrapperConfig } from './interfaces';

const DEFAULT_REGION = 'us-east-1';
const DEFAULT_MAX_KEYS = 1000;

/**
 * wrapper simple para operaciones s3
 */
export class S3Wrapper {
  private client: S3Client;
  private bucket: string;
  private readonly defaults: S3WrapperConfig;

  constructor(config: S3WrapperConfig) {
    const clientConfig: S3WrapperConfig = {
      bucket: config.bucket,
      region: config.region ?? process.env.AWS_REGION ?? DEFAULT_REGION,
    };

    if (config.credentials?.accessKeyId && config.credentials?.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.credentials.accessKeyId,
        secretAccessKey: config.credentials.secretAccessKey,
      };
    }

    this.bucket = config.bucket;
    this.defaults = clientConfig;
    this.client = new S3Client(clientConfig as S3ClientConfig);
  }

  newClient(options: S3WrapperConfig = this.defaults) {
    this.bucket = options.bucket;
    // merge defaults with options por si no se pasan todos los valores.
    const mergedOptions: S3WrapperConfig = { ...this.defaults, ...options };
    this.client = new S3Client(mergedOptions as S3ClientConfig);
  }

  getBucket(): string {
    return this.bucket;
  }

  setBucket(bucket: string) {
    this.newClient({ bucket });
  }

  /**
   * obtiene el cliente s3 para operaciones avanzadas
   */
  getClient(): S3Client {
    return this.client;
  }

  /**
   * sube un archivo a s3
   */
  async upload(
    key: string,
    body: Buffer | Uint8Array | string | ReadableStream,
    options?: {
      contentType?: string;
      metadata?: Record<string, string>;
    },
  ): Promise<boolean> {
    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
    };

    const response = await this.client.send(new PutObjectCommand(params));

    return wasSuccessful(response);
  }

  /**
   * descarga un archivo de s3
   */
  async download(
    key: string,
    responseType: 'text' | 'buffer' | 'stream' = 'text',
  ): Promise<string | Uint8Array | ReadableStream> {
    const params: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    const response = await this.client.send(new GetObjectCommand(params));

    if (!response.Body) {
      throw new Error('Empty response body');
    }

    if (!wasSuccessful(response)) {
      throw new Error('Failed to download file');
    }

    switch (responseType) {
      case 'text':
        return await response.Body.transformToString();
      case 'stream':
        return response.Body.transformToWebStream();
      case 'buffer':
      default:
        return await response.Body.transformToByteArray();
    }
  }

  /**
   * elimina un archivo de s3
   */
  async delete(key: string): Promise<boolean> {
    const params: DeleteObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    const response = await this.client.send(new DeleteObjectCommand(params));

    return wasSuccessful(response);
  }

  /**
   * verifica si un archivo existe
   */
  async exists(key: string): Promise<boolean> {
    const params: HeadObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    try {
      const response = await this.client.send(new HeadObjectCommand(params));
      return wasSuccessful(response);
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }

      throw error;
    }
  }

  /**
   * obtiene metadata de un archivo
   */
  async metadata(key: string): Promise<boolean> {
    const params: HeadObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    const response = await this.client.send(new HeadObjectCommand(params));
    return wasSuccessful(response);
  }

  /**
   * lista archivos en un bucket
   */
  async list(options?: {
    prefix?: string;
    maxKeys?: number;
    continuationToken?: string;
  }): Promise<ListObjectsV2CommandOutput> {
    const params: ListObjectsV2CommandInput = {
      Bucket: this.bucket,
      Prefix: options?.prefix,
      MaxKeys: options?.maxKeys ?? DEFAULT_MAX_KEYS,
      ContinuationToken: options?.continuationToken,
    };

    return await this.client.send(new ListObjectsV2Command(params));
  }

  /**
   * copia un archivo
   */
  async copy(
    sourceKey: string,
    destKey: string,
    destBucket: string = this.bucket,
  ): Promise<boolean> {
    const params: CopyObjectCommandInput = {
      Bucket: destBucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: destKey,
    };

    const response = await this.client.send(new CopyObjectCommand(params));
    return wasSuccessful(response);
  }

  /**
   * mueve un archivo (copia y elimina)
   */
  async move(
    sourceKey: string,
    destKey: string,
    destBucket: string = this.bucket,
  ): Promise<boolean> {
    const copyResult = await this.copy(sourceKey, destKey, destBucket);

    if (copyResult) {
      return await this.delete(sourceKey);
    }

    return copyResult;
  }

  /**
   * obtiene la región de un bucket a partir de su nombre.
   */
  async getBucketRegion(bucketName: string = this.bucket): Promise<string | undefined> {
    try {
      const response = await this.client.send(new GetBucketLocationCommand({ Bucket: bucketName }));
      return response.LocationConstraint;
    } catch (error) {
      throw error;
    }
  }
}

export * from './helpers';
export * from './interfaces';
