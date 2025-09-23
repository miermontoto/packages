export interface DynamoWrapperConfig {
  tableName: string;
  partitionKey: string;
  sortKey?: string;
  region?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  clientOptions?: {
    maxAttempts?: number;
    connectionTimeout?: number;
    socketTimeout?: number;
    maxSockets?: number;
  };
}

export interface DynamoKey {
  [key: string]: string | number;
}

export interface DynamoItem {
  [key: string]: any;
}

export interface QueryOptions {
  indexName?: string;
  keyConditionExpression?: string;
  filterExpression?: string;
  expressionValues?: Record<string, any>;
  expressionNames?: Record<string, string>;
  limit?: number;
  scanIndexForward?: boolean;
}

export interface ScanOptions {
  filterExpression?: string;
  expressionValues?: Record<string, any>;
  expressionNames?: Record<string, string>;
  limit?: number;
}

export interface UpdateOptions {
  conditionExpression?: string;
  returnValues?: "NONE" | "ALL_OLD" | "UPDATED_OLD" | "ALL_NEW" | "UPDATED_NEW";
}
