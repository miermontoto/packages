import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb";
import {
  BatchGetCommand,
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

import { buildUpdateExpression, serializeItem } from "./helpers";
import {
  DynamoItem,
  DynamoKey,
  DynamoWrapperConfig,
  QueryOptions,
  ScanOptions,
  UpdateOptions,
} from "./interfaces";

const DEFAULT_REGION = "us-east-1";
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_CONNECTION_TIMEOUT = 5000;
const DEFAULT_SOCKET_TIMEOUT = 60000;

/**
 * wrapper simple para operaciones dynamodb
 */
export class DynamoWrapper {
  private readonly client: DynamoDBClient;
  private readonly docClient: DynamoDBDocumentClient;
  protected readonly tableName: string;
  protected readonly partitionKey: string;
  protected readonly sortKey?: string;

  constructor(config: DynamoWrapperConfig) {
    const clientConfig: DynamoDBClientConfig = {
      region: config.region ?? process.env.AWS_REGION ?? DEFAULT_REGION,
      maxAttempts: config.clientOptions?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
      requestHandler: {
        connectionTimeout:
          config.clientOptions?.connectionTimeout ?? DEFAULT_CONNECTION_TIMEOUT,
        socketTimeout:
          config.clientOptions?.socketTimeout ?? DEFAULT_SOCKET_TIMEOUT,
      },
    };

    if (
      config.credentials?.accessKeyId &&
      config.credentials?.secretAccessKey
    ) {
      clientConfig.credentials = {
        accessKeyId: config.credentials.accessKeyId,
        secretAccessKey: config.credentials.secretAccessKey,
      };
    }

    this.client = new DynamoDBClient(clientConfig);
    this.docClient = DynamoDBDocumentClient.from(this.client, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });

    this.tableName = config.tableName;
    this.partitionKey = config.partitionKey;
    this.sortKey = config.sortKey;
  }

  /**
   * crea una key para operaciones
   */
  private createKey(
    partitionValue: string | number,
    sortValue?: string | number
  ): DynamoKey {
    const key: DynamoKey = {
      [this.partitionKey]: partitionValue,
    };

    if (this.sortKey && sortValue !== undefined) {
      key[this.sortKey] = sortValue;
    }

    return key;
  }

  /**
   * obtiene un item por su key
   */
  async get<T extends DynamoItem>(
    partitionValue: string | number,
    sortValue?: string | number
  ): Promise<T | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: this.createKey(partitionValue, sortValue),
      });

      const response = await this.docClient.send(command);
      return (response.Item as T) || null;
    } catch (error) {
      console.error("Error getting item:", error);
      return null;
    }
  }

  /**
   * guarda un item
   */
  async put<T extends DynamoItem>(item: T): Promise<boolean> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: serializeItem(item),
      });

      const response = await this.docClient.send(command);
      return response.$metadata.httpStatusCode === 200;
    } catch (error) {
      console.error("Error putting item:", error);
      return false;
    }
  }

  /**
   * actualiza atributos de un item
   */
  async update<T extends DynamoItem>(
    partitionValue: string | number,
    sortValue: string | number | undefined,
    attributes: Partial<T>,
    options?: UpdateOptions
  ): Promise<boolean> {
    try {
      const updateExpression = buildUpdateExpression(attributes);

      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: this.createKey(partitionValue, sortValue),
        ...updateExpression,
        ConditionExpression: options?.conditionExpression,
        ReturnValues: options?.returnValues ?? "NONE",
      });

      const response = await this.docClient.send(command);
      return response.$metadata.httpStatusCode === 200;
    } catch (error) {
      console.error("Error updating item:", error);
      return false;
    }
  }

  /**
   * elimina un item
   */
  async delete(
    partitionValue: string | number,
    sortValue?: string | number
  ): Promise<boolean> {
    try {
      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: this.createKey(partitionValue, sortValue),
      });

      const response = await this.docClient.send(command);
      return response.$metadata.httpStatusCode === 200;
    } catch (error) {
      console.error("Error deleting item:", error);
      return false;
    }
  }

  /**
   * query items usando partition key
   */
  async query<T extends DynamoItem>(
    partitionValue: string | number,
    options?: QueryOptions
  ): Promise<T[]> {
    try {
      let keyCondition = `#pk = :pk`;
      if (options?.keyConditionExpression) {
        keyCondition += ` AND ${options.keyConditionExpression}`;
      }

      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: options?.indexName,
        KeyConditionExpression: keyCondition,
        FilterExpression: options?.filterExpression,
        ExpressionAttributeNames: {
          "#pk": this.partitionKey,
          ...(options?.expressionNames || {}),
        },
        ExpressionAttributeValues: {
          ":pk": partitionValue,
          ...(options?.expressionValues || {}),
        },
        Limit: options?.limit,
        ScanIndexForward: options?.scanIndexForward,
      });

      const response = await this.docClient.send(command);
      return (response.Items || []) as T[];
    } catch (error) {
      console.error("Error querying items:", error);
      return [];
    }
  }

  /**
   * escanea la tabla completa
   */
  async scan<T extends DynamoItem>(options?: ScanOptions): Promise<T[]> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName,
        FilterExpression: options?.filterExpression,
        ExpressionAttributeValues: options?.expressionValues,
        ExpressionAttributeNames: options?.expressionNames,
        Limit: options?.limit,
      });

      const response = await this.docClient.send(command);
      return (response.Items || []) as T[];
    } catch (error) {
      console.error("Error scanning items:", error);
      return [];
    }
  }

  /**
   * obtiene múltiples items
   */
  async batchGet<T extends DynamoItem>(keys: DynamoKey[]): Promise<T[]> {
    try {
      const command = new BatchGetCommand({
        RequestItems: {
          [this.tableName]: {
            Keys: keys,
          },
        },
      });

      const response = await this.docClient.send(command);
      return (response.Responses?.[this.tableName] || []) as T[];
    } catch (error) {
      console.error("Error batch getting items:", error);
      return [];
    }
  }

  /**
   * guarda múltiples items
   */
  async batchPut<T extends DynamoItem>(items: T[]): Promise<boolean> {
    try {
      const putRequests = items.map((item) => ({
        PutRequest: {
          Item: serializeItem(item),
        },
      }));

      const command = new BatchWriteCommand({
        RequestItems: {
          [this.tableName]: putRequests,
        },
      });

      const response = await this.docClient.send(command);
      return response.$metadata.httpStatusCode === 200;
    } catch (error) {
      console.error("Error batch putting items:", error);
      return false;
    }
  }

  /**
   * elimina múltiples items
   */
  async batchDelete(keys: DynamoKey[]): Promise<boolean> {
    try {
      const deleteRequests = keys.map((key) => ({
        DeleteRequest: {
          Key: key,
        },
      }));

      const command = new BatchWriteCommand({
        RequestItems: {
          [this.tableName]: deleteRequests,
        },
      });

      const response = await this.docClient.send(command);
      return response.$metadata.httpStatusCode === 200;
    } catch (error) {
      console.error("Error batch deleting items:", error);
      return false;
    }
  }

  /**
   * obtiene el cliente dynamodb para operaciones avanzadas
   */
  getDocClient(): DynamoDBDocumentClient {
    return this.docClient;
  }

  /**
   * obtiene el cliente base de dynamodb
   */
  getClient(): DynamoDBClient {
    return this.client;
  }
}

export * from "./helpers";
export * from "./interfaces";
