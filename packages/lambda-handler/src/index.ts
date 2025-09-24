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
 * Handler base de todos los servicios de la lambda.
 * Todos los servicios deben heredar de esta clase y implementar el método
 * handleRoutes.
 *
 * @see handleRoutes
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
   * Handler de las rutas de cada servicio. Este método tiene que contener
   * el mapping de todas las rutas de cada servicio, y devolver/controlar
   * lo que se necesite en cada caso.
   *
   * @param event - Evento de entrada.
   * @param context - Contexto de la lambda.
   * @param callback - Callback de la lambda.
   * @returns Respuesta estándar de información.
   */
  protected abstract handleRoutes(
    event: APIGatewayProxyEventV2,
    context: Context,
    callback: Callback
  ): Promise<APIGatewayProxyStructuredResultV2>;

  /**
   * Handler base de todos los servicios de la lambda.
   * Se encarga de mapear el healthcheck (que siempre está presente) y lanzar
   * el handler de las rutas que defina cada servicio.
   *
   * @see handleRoutes
   *
   * @param event - Evento de entrada.
   * @param context - Contexto de la lambda.
   * @param callback - Callback de la lambda.
   * @returns Respuesta estándar de información.
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

      // warmups o healthchecks
      if (
        isWarmupEvent(event) ||
        isHealthCheck(event, this.config.healthCheckPath)
      ) {
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
   * Función auxiliar que devuelve un 200 de forma estándar.
   * Se puede expandir para devolver más información, pero pa qué.
   *
   * @returns 200 de forma estándar.
   */
  protected healthCheck(): APIGatewayProxyStructuredResultV2 {
    return ok({ status: "healthy", timestamp: new Date().toISOString() });
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
   * Función auxiliar que envuelve un handler con sus movidas porque el tipado
   * de TypeScript es un poco asqueroso a veces.
   *
   * No hace nada más, solo lanza el handler y devuelve lo que devuelva.
   *
   * @param handler - Handler a lanzar.
   * @param event - Evento de entrada.
   * @param context - Contexto de la lambda.
   * @param callback - Callback de la lambda.
   * @returns Lo que devuelva el handler.
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
