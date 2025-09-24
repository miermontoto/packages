import { APIGatewayProxyEventV2 } from "aws-lambda";

/**
 * extrae el método http del evento
 */
export function getHttpMethod(event: APIGatewayProxyEventV2): string {
  return event.requestContext?.http?.method ?? "UNKNOWN";
}

/**
 * extrae la ruta del evento
 */
export function getPath(event: APIGatewayProxyEventV2): string {
  return event.rawPath ?? event.requestContext?.http?.path ?? "/";
}

/**
 * parsea el body del evento
 */
export function parseBody<T = any>(event: APIGatewayProxyEventV2): T | null {
  if (!event.body) return null;

  try {
    if (event.isBase64Encoded) {
      const decoded = Buffer.from(event.body, "base64").toString("utf-8");
      return JSON.parse(decoded);
    }
    return JSON.parse(event.body);
  } catch (error) {
    console.error("Error parsing body:", error);
    return null;
  }
}

/**
 * extrae query parameters del evento
 */
export function getQueryParams(
  event: APIGatewayProxyEventV2
): Record<string, string | undefined> {
  return event.queryStringParameters ?? {};
}

/**
 * extrae path parameters del evento
 */
export function getPathParams(
  event: APIGatewayProxyEventV2
): Record<string, string | undefined> {
  return event.pathParameters ?? {};
}

/**
 * extrae headers del evento
 */
export function getHeaders(
  event: APIGatewayProxyEventV2
): Record<string, string | undefined> {
  return event.headers ?? {};
}

/**
 * verifica si es un warmup event
 */
export function isWarmupEvent(event: APIGatewayProxyEventV2): boolean {
  // cloudwatch events o eventbridge (estos vienen como any, no como APIGatewayProxyEventV2)
  const anyEvent = event as any;
  if (
    anyEvent.source === "aws.events" ||
    anyEvent["detail-type"] === "Scheduled Event"
  ) {
    return true;
  }

  return !!event.headers?.["lambda-warmer"];
}

/**
 * verifica si es un health check
 */
export function isHealthCheck(
  event: APIGatewayProxyEventV2,
  path: string = "/health"
): boolean {
  const eventPath = getPath(event);
  return eventPath === path || eventPath.includes(path);
}
