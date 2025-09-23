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
 * crea una respuesta estándar para aws lambda
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
 * respuesta 200 ok
 */
export function ok(
  body: any = { message: "OK" },
  options: ResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(200, body, options);
}

/**
 * respuesta 201 created
 */
export function created(
  body: any = { message: "Created" },
  options: ResponseOptions = {}
): APIGatewayProxyStructuredResultV2 {
  return createResponse(201, body, options);
}

/**
 * respuesta 204 no content
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
 * respuesta 400 bad request
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
 * respuesta 401 unauthorized
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
 * respuesta 403 forbidden
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
 * respuesta 404 not found
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
 * respuesta 409 conflict
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
 * respuesta 422 unprocessable entity
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
 * respuesta 429 too many requests
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
 * respuesta 500 internal server error
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
