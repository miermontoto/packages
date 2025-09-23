/**
 * genera una clave única para el caché
 */
export function generateCacheKey(
  prefix: string,
  partitionValue: string | number,
  sortValue?: string | number
): string {
  const key = `${prefix}:${partitionValue}`;
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