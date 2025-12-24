import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ErrorResponseOptions, ResponseOptions } from "./interfaces";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT,DELETE",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
};

/**
 * Función auxiliar para crear una respuesta estándar de información.
 * El resto de métodos de este fichero se basan en esta función.
 *
 * @param statusCode - Código de estado de la respuesta.
 * @param body - Cuerpo de la respuesta.
 * @param options - Opciones de la respuesta.
 * @returns Respuesta estándar de información.
 */
export function createResponse(
  statusCode: number,
  body: Record<string, any> | string,
  options: ResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  const { headers = {}, cors = true } = options;

  const responseHeaders = {
    ...DEFAULT_HEADERS,
    ...(cors ? CORS_HEADERS : {}),
    ...headers,
  };

  return {
    statusCode,
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: responseHeaders,
  };
}

/**
 * Función auxiliar para crear una respuesta 200 estandarizada.
 * @see createResponse
 *
 * @param body - Cuerpo de la respuesta (opcional).
 * @param options - Opciones de la respuesta (opcional).
 * @returns Respuesta 200 de forma estándar.
 */
export function ok(
  body: any = { message: "OK" },
  options: ResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(200, body, options);
}

/**
 * Función auxiliar para crear una respuesta 201 estandarizada.
 * @see createResponse
 *
 * @param body - Cuerpo de la respuesta (opcional).
 * @param options - Opciones de la respuesta (opcional).
 * @returns Respuesta 201 de forma estándar.
 */
export function created(
  body: any = { message: "Created" },
  options: ResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(201, body, options);
}

/**
 * Función auxiliar para crear una respuesta 204 estandarizada.
 * @see createResponse
 *
 * @param options - Opciones de la respuesta (opcional).
 * @returns Respuesta 204 de forma estándar.
 */
export function noContent(
  options: ResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 204,
    headers: {
      ...(options.cors !== false ? CORS_HEADERS : {}),
      ...options.headers,
    },
  };
}

/**
 * Función auxiliar para crear una respuesta 400 estandarizada.
 * @see createResponse
 *
 * @param message - Mensaje de la respuesta (opcional).
 * @param options - Opciones de la respuesta (opcional).
 * @returns Respuesta 400 de forma estándar.
 */
export function badRequest(
  message: string = "Bad Request",
  options: ErrorResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(400, {
    error: options.error ?? "Bad Request",
    message,
    ...(options.details && { details: options.details }),
  });
}

/**
 * Función auxiliar para crear una respuesta 401 estandarizada.
 * @see createResponse
 *
 * @param message - Mensaje de la respuesta (opcional).
 * @param options - Opciones de la respuesta (opcional).
 * @returns Respuesta 401 de forma estándar.
 */
export function unauthorized(
  message: string = "You are not authorized to access this resource",
  options: ErrorResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(401, {
    error: options.error ?? "Unauthorized",
    message,
    ...(options.details && { details: options.details }),
  });
}

/**
 * Función auxiliar para crear una respuesta 403 estandarizada.
 * @see createResponse
 *
 * @param message - Mensaje de la respuesta (opcional).
 * @param options - Opciones de la respuesta (opcional).
 * @returns Respuesta 403 de forma estándar.
 */
export function forbidden(
  message: string = "You do not have permission to access this resource",
  options: ErrorResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(403, {
    error: options.error ?? "Forbidden",
    message,
    ...(options.details && { details: options.details }),
  });
}

/**
 * Función auxiliar para crear una respuesta 404 estandarizada.
 * @see createResponse
 *
 * @param message - Mensaje de la respuesta (opcional).
 * @param options - Opciones de la respuesta (opcional).
 * @returns Respuesta 404 de forma estándar.
 */
export function notFound(
  message: string = "The requested resource does not exist",
  options: ErrorResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(404, {
    error: options.error ?? "Not Found",
    message,
    ...(options.details && { details: options.details }),
  });
}

/**
 * Función auxiliar para crear una respuesta 409 estandarizada.
 * @see createResponse
 *
 * @param message - Mensaje de la respuesta (opcional).
 * @param options - Opciones de la respuesta (opcional).
 * @returns Respuesta 409 de forma estándar.
 */
export function conflict(
  message: string = "The request could not be completed due to a conflict",
  options: ErrorResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(409, {
    error: options.error ?? "Conflict",
    message,
    ...(options.details && { details: options.details }),
  });
}

/**
 * Función auxiliar para crear una respuesta 422 estandarizada.
 * @see createResponse
 *
 * @param message - Mensaje de la respuesta (opcional).
 * @param options - Opciones de la respuesta (opcional).
 * @returns Respuesta 422 de forma estándar.
 */
export function unprocessableEntity(
  message: string = "The request could not be processed",
  options: ErrorResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(422, {
    error: options.error ?? "Unprocessable Entity",
    message,
    ...(options.details && { details: options.details }),
  });
}

/**
 * Función auxiliar para crear una respuesta 429 estandarizada.
 * @see createResponse
 *
 * @param message - Mensaje de la respuesta (opcional).
 * @param options - Opciones de la respuesta (opcional).
 * @returns Respuesta 429 de forma estándar.
 */
export function tooManyRequests(
  message: string = "Too many requests",
  options: ErrorResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(429, {
    error: options.error ?? "Too Many Requests",
    message,
    ...(options.details && { details: options.details }),
  });
}

/**
 * Función auxiliar para crear una respuesta 500 estandarizada.
 * @see createResponse
 *
 * @param message - Mensaje de la respuesta (opcional).
 * @param options - Opciones de la respuesta (opcional).
 * @returns Respuesta 500 de forma estándar.
 */
export function serverError(
  message: string | Error = "An error occurred while processing the request",
  options: ErrorResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(500, {
    error: options.error ?? "Internal Server Error",
    message: message instanceof Error ? message.message : message,
    ...(options.details && { details: options.details }),
  });
}

export * from "./interfaces";
