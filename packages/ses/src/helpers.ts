/**
 * verifica si la respuesta fue exitosa
 */
export function wasSuccessful(response: any): boolean {
  const statusCode = response?.$metadata?.httpStatusCode;
  return statusCode >= 200 && statusCode < 300;
}

/**
 * normaliza direcciones de email a array
 */
export function normalizeEmailAddresses(
  addresses: string | string[] | undefined
): string[] | undefined {
  if (!addresses) return undefined;
  return Array.isArray(addresses) ? addresses : [addresses];
}

/**
 * valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * valida múltiples emails
 */
export function validateEmails(emails: string[]): boolean {
  return emails.every(isValidEmail);
}

/**
 * extrae el dominio de un email
 */
export function extractDomain(email: string): string {
  return email.split("@")[1] || "";
}

/**
 * parsea headers de email
 */
export function parseEmailHeaders(headers: any[]): Record<string, string> {
  const parsed: Record<string, string> = {};

  if (!headers || !Array.isArray(headers)) {
    return parsed;
  }

  headers.forEach((header) => {
    if (header.name && header.value) {
      parsed[header.name.toLowerCase()] = header.value;
    }
  });

  return parsed;
}
