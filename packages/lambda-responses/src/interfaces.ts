export interface ResponseOptions {
  headers?: Record<string, string>;
  cors?: boolean;
}

export interface ErrorResponseOptions {
  statusCode?: number;
  error?: string;
  details?: any;
}
