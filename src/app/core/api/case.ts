/**
 * Convert object keys between the API's snake_case and the app's
 * camelCase. Recurses through plain objects and arrays; leaves strings,
 * numbers, `null` and `Date`s alone.
 */

type Json = unknown;

function transformKeys(value: Json, key: (k: string) => string): Json {
  if (Array.isArray(value)) {
    return value.map((item) => transformKeys(item, key));
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, Json>).map(([k, v]) => [
        key(k),
        transformKeys(v, key),
      ]),
    );
  }
  return value;
}

const toCamel = (k: string): string => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

const toSnake = (k: string): string => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

export function camelizeKeys<T>(value: Json): T {
  return transformKeys(value, toCamel) as T;
}

export function snakeizeKeys<T>(value: Json): T {
  return transformKeys(value, toSnake) as T;
}
