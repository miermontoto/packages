import { ok, serverError } from "@miermontoto/lambda-responses";
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
  Callback,
  Context,
} from "aws-lambda";

import { isHealthCheck, isWarmupEvent } from "./helpers";
import { ErrorHandler, HandlerConfig, MiddlewareFunction } from "./interfaces";

/**
 * clase base para handlers de aws lambda
 * todos los servicios deben heredar de esta clase e implementar handleRoutes
 */
export abstract class BaseHandler {
  protected config: HandlerConfig;
  protected middlewares: MiddlewareFunction[] = [];
  protected errorHandler?: ErrorHandler;

  constructor(config: HandlerConfig = {}) {
    this.config = {
      healthCheckPath: "/health",
      enableCors: true,
      enableLogging: true,
      ...config,
    };
  }

  /**
   * handler de las rutas de cada servicio
   * debe contener el mapping de todas las rutas
   */
  protected abstract handleRoutes(
    event: APIGatewayProxyEventV2,
    context: Context,
    callback: Callback
  ): Promise<APIGatewayProxyStructuredResultV2>;

  /**
   * handler principal de la lambda
   */
  public handler: APIGatewayProxyHandlerV2 = async (
    event: APIGatewayProxyEventV2,
    context: Context,
    callback: Callback
  ): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
      // log request si está habilitado
      if (this.config.enableLogging) {
        console.log("Request:", {
          path: event.rawPath,
          method: event.requestContext?.http?.method,
          headers: event.headers,
        });
      }

      // warmup check
      if (isWarmupEvent(event)) {
        return this.handleWarmup();
      }

      // health check
      if (isHealthCheck(event, this.config.healthCheckPath)) {
        return this.healthCheck();
      }

      // ejecutar middlewares
      return await this.executeMiddlewares(event, context, async () => {
        return await this.handleRoutes(event, context, callback);
      });
    } catch (error) {
      console.error("Error handling request:", error);

      // usar error handler personalizado si existe
      if (this.errorHandler) {
        return this.errorHandler(error as Error, event, context);
      }

      return serverError(error as Error);
    }
  };

  /**
   * health check response
   */
  protected healthCheck(): APIGatewayProxyStructuredResultV2 {
    return ok({ status: "healthy", timestamp: new Date().toISOString() });
  }

  /**
   * warmup response
   */
  protected handleWarmup(): APIGatewayProxyStructuredResultV2 {
    if (this.config.enableLogging) {
      console.log("Lambda warmed up");
    }
    return ok({ message: "Lambda warmed" });
  }

  /**
   * añade un middleware
   */
  public use(middleware: MiddlewareFunction): void {
    this.middlewares.push(middleware);
  }

  /**
   * establece un error handler personalizado
   */
  public setErrorHandler(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }

  /**
   * ejecuta los middlewares en orden
   */
  private async executeMiddlewares(
    event: APIGatewayProxyEventV2,
    context: Context,
    final: () => Promise<APIGatewayProxyStructuredResultV2>
  ): Promise<APIGatewayProxyStructuredResultV2> {
    let index = 0;

    const next = async (): Promise<APIGatewayProxyStructuredResultV2> => {
      if (index >= this.middlewares.length) {
        return final();
      }

      const middleware = this.middlewares[index++];
      return middleware(event, context, next);
    };

    return next();
  }

  /**
   * wrapper para handlers con tipado
   */
  protected async wrapHandler(
    handler: APIGatewayProxyHandlerV2,
    event: APIGatewayProxyEventV2,
    context: Context,
    callback: Callback
  ): Promise<APIGatewayProxyStructuredResultV2> {
    const result = await handler(event, context, callback);
    return result as APIGatewayProxyStructuredResultV2;
  }
}

export * from "./helpers";
export * from "./interfaces";
