import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
  Callback,
} from 'aws-lambda';

export interface HandlerConfig {
  healthCheckPath?: string;
  enableCors?: boolean;
  enableLogging?: boolean;
  warmupPath?: string;
}

export interface RouteHandler {
  (
    event: APIGatewayProxyEventV2,
    context: Context,
    callback: Callback
  ): Promise<APIGatewayProxyStructuredResultV2>;
}

export interface MiddlewareFunction {
  (
    event: APIGatewayProxyEventV2,
    context: Context,
    next: () => Promise<APIGatewayProxyStructuredResultV2>
  ): Promise<APIGatewayProxyStructuredResultV2>;
}

export interface ErrorHandler {
  (
    error: Error,
    event: APIGatewayProxyEventV2,
    context: Context
  ): APIGatewayProxyStructuredResultV2;
}