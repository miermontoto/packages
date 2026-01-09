/**
 * genera una clave única para el caché (sin prefijo, LocalCache lo maneja)
 */
export function generateCacheKey(
  partitionValue: string | number,
  sortValue?: string | number
): string {
  const key = `${partitionValue}`;
  return sortValue !== undefined ? `${key}:${sortValue}` : key;
}

/**
 * extrae valores de partition y sort de un item
 */
export function extractKeys(
  item: any,
  partitionKey: string,
  sortKey?: string
): { partitionValue: string | number; sortValue?: string | number } {
  const partitionValue = item[partitionKey];
  const sortValue = sortKey ? item[sortKey] : undefined;
  return { partitionValue, sortValue };
}