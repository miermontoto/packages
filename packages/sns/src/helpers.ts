/**
 * verifica si la respuesta fue exitosa
 */
export function wasSuccessful(response: any): boolean {
  const statusCode = response?.$metadata?.httpStatusCode;
  return statusCode >= 200 && statusCode < 300;
}

/**
 * valida un número de teléfono en formato e.164
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * valida un arn de sns
 */
export function isValidArn(arn: string): boolean {
  const arnRegex = /^arn:aws[a-z\-]*:sns:[a-z0-9\-]+:\d{12}:[a-zA-Z0-9\-_]+$/;
  return arnRegex.test(arn);
}

/**
 * parsea mensaje json si es posible
 */
export function tryParseJson(message: string): any {
  try {
    return JSON.parse(message);
  } catch {
    return message;
  }
}

/**
 * formatea mensaje para diferentes protocolos
 */
export function formatMessageForProtocol(
  message: string,
  protocol?: string
): string {
  if (!protocol) return message;

  switch (protocol) {
    case "sms":
      // limitar sms a 140 caracteres
      return message.length > 140 ? message.substring(0, 137) + "..." : message;
    case "email":
    case "email-json":
      return message;
    default:
      return message;
  }
}

/**
 * extrae atributos de mensaje de sns
 */
export function extractMessageAttributes(attributes: any): Record<string, any> {
  const extracted: Record<string, any> = {};

  if (!attributes || typeof attributes !== "object") {
    return extracted;
  }

  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === "object" && value !== null) {
      const attr = value as any;
      if (attr.Type === "String" && attr.Value) {
        extracted[key] = attr.Value;
      } else if (attr.Type === "Number" && attr.Value) {
        extracted[key] = parseFloat(attr.Value);
      } else if (attr.Type === "Binary" && attr.Value) {
        extracted[key] = attr.Value;
      }
    }
  }

  return extracted;
}
