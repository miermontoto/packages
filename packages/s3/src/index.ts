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
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';

import { S3WrapperConfig } from './interfaces';

const DEFAULT_REGION = 'us-east-1';
const DEFAULT_DOWNLOAD_TYPE = 'buffer';
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
   * sube un archivo a s3
   */
  async upload(
    key: string,
    body: Buffer | Uint8Array | string | ReadableStream,
    options?: {
      bucket?: string;
      contentType?: string;
      metadata?: Record<string, string>;
    },
  ) {
    const params: PutObjectCommandInput = {
      Bucket: options?.bucket ?? this.bucket,
      Key: key,
      Body: body,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
    };

    if (!params.Bucket) {
      throw new Error('Bucket is required');
    }

    return await this.client.send(new PutObjectCommand(params));
  }

  /**
   * descarga un archivo de s3
   */
  async download(
    key: string,
    options?: {
      bucket?: string;
      responseType?: 'text' | 'buffer' | 'stream';
    },
  ) {
    const params: GetObjectCommandInput = {
      Bucket: options?.bucket ?? this.bucket,
      Key: key,
    };

    if (!params.Bucket) {
      throw new Error('Bucket is required');
    }

    const response = await this.client.send(new GetObjectCommand(params));

    if (!response.Body) {
      throw new Error('Empty response body');
    }

    const responseType = options?.responseType ?? DEFAULT_DOWNLOAD_TYPE;

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
  async delete(key: string, bucket?: string) {
    const params: DeleteObjectCommandInput = {
      Bucket: bucket || this.bucket,
      Key: key,
    };

    if (!params.Bucket) {
      throw new Error('Bucket is required');
    }

    return await this.client.send(new DeleteObjectCommand(params));
  }

  /**
   * verifica si un archivo existe
   */
  async exists(key: string, bucket?: string): Promise<boolean> {
    const params: HeadObjectCommandInput = {
      Bucket: bucket ?? this.bucket,
      Key: key,
    };

    if (!params.Bucket) {
      throw new Error('Bucket is required');
    }

    try {
      await this.client.send(new HeadObjectCommand(params));
      return true;
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
  async metadata(key: string, bucket?: string) {
    const params: HeadObjectCommandInput = {
      Bucket: bucket ?? this.bucket,
      Key: key,
    };

    if (!params.Bucket) {
      throw new Error('Bucket is required');
    }

    return await this.client.send(new HeadObjectCommand(params));
  }

  /**
   * lista archivos en un bucket
   */
  async list(options?: {
    bucket?: string;
    prefix?: string;
    maxKeys?: number;
    continuationToken?: string;
  }) {
    const params: ListObjectsV2CommandInput = {
      Bucket: options?.bucket ?? this.bucket,
      Prefix: options?.prefix,
      MaxKeys: options?.maxKeys ?? DEFAULT_MAX_KEYS,
      ContinuationToken: options?.continuationToken,
    };

    if (!params.Bucket) {
      throw new Error('Bucket is required');
    }

    return await this.client.send(new ListObjectsV2Command(params));
  }

  /**
   * copia un archivo
   */
  async copy(
    sourceKey: string,
    destKey: string,
    options?: {
      sourceBucket?: string;
      destBucket?: string;
    },
  ) {
    const sourceBucket = options?.sourceBucket ?? this.bucket;
    const destBucket = options?.destBucket ?? this.bucket;

    if (!sourceBucket || !destBucket) {
      throw new Error('Source and destination buckets are required');
    }

    const params: CopyObjectCommandInput = {
      Bucket: destBucket,
      CopySource: `${sourceBucket}/${sourceKey}`,
      Key: destKey,
    };

    return await this.client.send(new CopyObjectCommand(params));
  }

  /**
   * mueve un archivo (copia y elimina)
   */
  async move(
    sourceKey: string,
    destKey: string,
    options?: {
      sourceBucket?: string;
      destBucket?: string;
    },
  ) {
    const copyResult = await this.copy(sourceKey, destKey, options);

    if (copyResult.$metadata.httpStatusCode === 200) {
      await this.delete(sourceKey, options?.sourceBucket);
    }

    return copyResult;
  }

  /**
   * obtiene la región de un bucket a partir de su nombre.
   */
  async getBucketRegion(bucketName?: string) {
    try {
      const response = await this.client.send(
        new GetBucketLocationCommand({ Bucket: bucketName ?? this.bucket }),
      );
      return response.LocationConstraint ?? DEFAULT_REGION;
    } catch (error) {
      throw error;
    }
  }

  /**
   * obtiene el cliente s3 para operaciones avanzadas
   */
  getClient(): S3Client {
    return this.client;
  }

  /**
   * obtiene el nombre del fichero dentro de un evento S3 (como el que reciben las lambdas)
   */
  static getKeyFromEvent(event: any, firstOnly: boolean = true): string | string[] | null {
    if (event.Records && Array.isArray(event.Records)) {
      const keys = event.Records.map((record: any) => record.s3?.object?.key).filter(
        (key: any) => key,
      );
      return keys.length === 1 && firstOnly ? keys[0] : keys;
    }

    return null;
  }
}

// exporta las interfaces
export * from './interfaces';
