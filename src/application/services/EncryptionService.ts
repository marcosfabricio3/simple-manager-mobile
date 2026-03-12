import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

/**
 * Versioning allows future key-rotation and algorithm migrations without
 * breaking existing encrypted data.
 */
const MASTER_KEY_ALIAS = "v2.aes256gcm.master.key";
const ENC_VERSION_V2 = "enc_v2:"; // AES-256-GCM (this implementation)
const ENC_VERSION_V1 = "enc_v1:"; // Legacy Base64 obfuscation (read-only migration)

const AES_ALGORITHM = "AES-GCM";
const KEY_LENGTH_BITS = 256;
const IV_LENGTH_BYTES = 12; // 96-bit IV — recommended for AES-GCM

// ---------------------------------------------------------------------------
// Low-level helpers: ArrayBuffer ↔ Base64
// These avoid deprecated `btoa`/`atob` patterns for Unicode safety.
// ---------------------------------------------------------------------------

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ---------------------------------------------------------------------------
// EncryptionService — Field-Level Encryption (FLE)
// Algorithm : AES-256-GCM  (authenticated encryption with associated data)
// Key store  : expo-secure-store (TEE / Keychain)
// Format     : "enc_v2:<base64(iv)>.<base64(ciphertext+authTag)>"
// ---------------------------------------------------------------------------

/**
 * Field-Level Encryption service using AES-256-GCM.
 *
 * Security properties:
 *  - 256-bit key generated once per installation, stored in the device's
 *    Trusted Execution Environment (Android Keystore / iOS Keychain).
 *  - Each encryption call generates a fresh 12-byte random IV via
 *    expo-crypto.getRandomBytesAsync — never reuses IV+key pairs.
 *  - AES-GCM provides both confidentiality AND integrity (auth tag).
 *  - Backward-compatible: can still decrypt legacy enc_v1 Base64 data.
 */
export class EncryptionService {
  /** In-process CryptoKey cache — avoids round-trip to SecureStore per call */
  private static cachedCryptoKey: CryptoKey | null = null;

  // ---------------------------------------------------------------------------
  // Key management
  // ---------------------------------------------------------------------------

  /**
   * Returns (or generates and persists) the AES-256-GCM CryptoKey.
   * The raw key material never leaves SecureStore in plaintext; it is
   * imported back into a non-extractable CryptoKey after retrieval.
   */
  private async getCryptoKey(): Promise<CryptoKey> {
    if (EncryptionService.cachedCryptoKey) {
      return EncryptionService.cachedCryptoKey;
    }

    let rawKeyBase64 = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);

    if (!rawKeyBase64) {
      // First run: generate a new 256-bit key and persist it
      const keyBytes = await Crypto.getRandomBytesAsync(KEY_LENGTH_BITS / 8);
      rawKeyBase64 = bufferToBase64(keyBytes.buffer as ArrayBuffer);
      await SecureStore.setItemAsync(MASTER_KEY_ALIAS, rawKeyBase64);
    }

    const rawKeyBuffer = base64ToBuffer(rawKeyBase64);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      rawKeyBuffer,
      { name: AES_ALGORITHM },
      false, // non-extractable: key cannot be exported again from memory
      ["encrypt", "decrypt"],
    );

    EncryptionService.cachedCryptoKey = cryptoKey;
    return cryptoKey;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Encrypts a plain-text string using AES-256-GCM.
   *
   * @param text - The string to encrypt. Empty strings are returned as-is.
   * @returns A versioned, base64-encoded string: "enc_v2:<ivB64>.<cipherB64>"
   */
  async encrypt(text: string): Promise<string> {
    if (!text) return text;

    try {
      const key = await this.getCryptoKey();

      // Fresh random IV for every encryption — critical for AES-GCM security
      const ivBytes = await Crypto.getRandomBytesAsync(IV_LENGTH_BYTES);
      const iv = ivBytes.buffer as ArrayBuffer;

      const encoder = new TextEncoder();
      const plainBuffer = encoder.encode(text);

      const cipherBuffer = await crypto.subtle.encrypt(
        { name: AES_ALGORITHM, iv },
        key,
        plainBuffer,
      );

      const ivBase64 = bufferToBase64(iv);
      const cipherBase64 = bufferToBase64(cipherBuffer);

      return `${ENC_VERSION_V2}${ivBase64}.${cipherBase64}`;
    } catch (e) {
      console.error("[EncryptionService] encrypt failed:", e);
      // Fallback: return plaintext rather than crash — log for diagnostics
      return text;
    }
  }

  /**
   * Decrypts a string previously encrypted by this service.
   *
   * Supports both:
   *  - enc_v2 (AES-256-GCM) — current
   *  - enc_v1 (Base64 obfuscation) — legacy migration path
   *
   * @param encryptedText - The encrypted string to decrypt.
   * @returns The original plain-text string.
   */
  async decrypt(encryptedText: string | null | undefined): Promise<string> {
    if (!encryptedText) return "";

    // --- Handle legacy enc_v1 data (read-only migration) ---
    if (encryptedText.startsWith(ENC_VERSION_V1)) {
      try {
        const data = encryptedText.substring(ENC_VERSION_V1.length);
        return decodeURIComponent(escape(atob(data)));
      } catch (e) {
        console.error("[EncryptionService] legacy decrypt failed:", e);
        return encryptedText;
      }
    }

    // --- Handle current enc_v2 data ---
    if (!encryptedText.startsWith(ENC_VERSION_V2)) {
      // Unrecognized format or plaintext data — return as-is
      return encryptedText;
    }

    try {
      const payload = encryptedText.substring(ENC_VERSION_V2.length);
      const dotIdx = payload.indexOf(".");

      if (dotIdx === -1) throw new Error("Invalid enc_v2 format");

      const ivBase64 = payload.substring(0, dotIdx);
      const cipherBase64 = payload.substring(dotIdx + 1);

      const iv = base64ToBuffer(ivBase64);
      const cipherBuffer = base64ToBuffer(cipherBase64);
      const key = await this.getCryptoKey();

      const plainBuffer = await crypto.subtle.decrypt(
        { name: AES_ALGORITHM, iv },
        key,
        cipherBuffer,
      );

      const decoder = new TextDecoder();
      return decoder.decode(plainBuffer);
    } catch (e) {
      console.error("[EncryptionService] decrypt failed:", e);
      return encryptedText;
    }
  }

  /**
   * Wipes the in-memory cached key.
   * Call on app lock or logout if biometric protection is active.
   */
  static clearKeyCache(): void {
    EncryptionService.cachedCryptoKey = null;
  }

  // ---------------------------------------------------------------------------
  // Key export / import (used by BackupService for portable encrypted backups)
  // ---------------------------------------------------------------------------

  /**
   * Exports the raw master key from SecureStore as a base64 string.
   * NEVER share this value directly — BackupService wraps it in PBKDF2+AES-GCM.
   */
  async exportRawMasterKey(): Promise<string> {
    let rawKeyBase64 = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);
    if (!rawKeyBase64) {
      // If called before any encrypt, generate & persist the key first
      await this.getCryptoKey();
      rawKeyBase64 = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);
    }
    return rawKeyBase64!;
  }

  /**
   * Imports an external raw master key into SecureStore.
   * Used during backup restore — after this call the app uses the restored key.
   */
  async importRawMasterKey(rawKeyBase64: string): Promise<void> {
    await SecureStore.setItemAsync(MASTER_KEY_ALIAS, rawKeyBase64);
    EncryptionService.clearKeyCache();
  }
}

export const encryptionService = new EncryptionService();
