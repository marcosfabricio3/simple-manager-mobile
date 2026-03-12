import * as Crypto from "expo-crypto";

/**
 * Generates a standard UUID v4 for database entities.
 */
export function generateId(): string {
  return Crypto.randomUUID();
}
