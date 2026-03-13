import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

/**
 * Versioning allows future key-rotation and algorithm migrations without
 * breaking existing encrypted data.
 */
const MASTER_KEY_ALIAS = "v2.aes256gcm.master.key";
const ENC_VERSION_V2 = "enc_v2:"; // AES-256-GCM
const ENC_VERSION_V1 = "enc_v1:"; // Legacy Base64 obfuscation

const AES_ALGORITHM = "AES-GCM";
const KEY_LENGTH_BITS = 256;
const IV_LENGTH_BYTES = 12;

// ---------------------------------------------------------------------------
// Helpers: Resolve the Web Crypto 'subtle' object
// In Expo/React Native, it might be in different places depending on the version.
// ---------------------------------------------------------------------------
const getSubtle = () => {
  // 1. Try expo-crypto named/namespace export (SDK 51+)
  const c = (Crypto as any).subtle;
  if (c && typeof c.importKey === "function") return c;

  // 2. Try global crypto (if polyfilled or native in newer RN)
  const globalCrypto = (global as any).crypto || (global as any).Crypto;
  if (globalCrypto?.subtle && typeof globalCrypto.subtle.importKey === "function") {
    return globalCrypto.subtle;
  }
  
  return null;
};

// Simple Base64 for fallback (not safe for wide Unicode, but works for keys/ivs)
const simpleB64Encode = (str: string) => btoa(str);
const simpleB64Decode = (str: string) => atob(str);

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

export class EncryptionService {
  private static cachedCryptoKey: CryptoKey | null = null;

  private async getCryptoKey(): Promise<CryptoKey | null> {
    const subtle = getSubtle();
    if (!subtle) return null;

    if (EncryptionService.cachedCryptoKey) {
      return EncryptionService.cachedCryptoKey;
    }

    let rawKeyBase64 = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);

    if (!rawKeyBase64) {
      const keyBytes = await Crypto.getRandomBytesAsync(KEY_LENGTH_BITS / 8);
      rawKeyBase64 = bufferToBase64(keyBytes.buffer as ArrayBuffer);
      await SecureStore.setItemAsync(MASTER_KEY_ALIAS, rawKeyBase64);
    }

    const rawKeyBuffer = base64ToBuffer(rawKeyBase64);

    const cryptoKey = await subtle.importKey(
      "raw",
      rawKeyBuffer,
      { name: AES_ALGORITHM },
      false,
      ["encrypt", "decrypt"],
    );

    EncryptionService.cachedCryptoKey = cryptoKey;
    return cryptoKey;
  }

  async encrypt(text: string): Promise<string> {
    if (!text) return text;

    try {
      const subtle = getSubtle();
      const key = await this.getCryptoKey();

      // If WebCrypto is not available (Expo Go limitation), fallback to simple obfuscation
      if (!subtle || !key) {
        return `${ENC_VERSION_V1}${encodeURIComponent(text)}`;
      }

      const ivBytes = await Crypto.getRandomBytesAsync(IV_LENGTH_BYTES);
      const iv = ivBytes.buffer as ArrayBuffer;

      const encoder = new TextEncoder();
      const plainBuffer = encoder.encode(text);

      const cipherBuffer = await subtle.encrypt(
        { name: AES_ALGORITHM, iv },
        key,
        plainBuffer,
      );

      const ivBase64 = bufferToBase64(iv);
      const cipherBase64 = bufferToBase64(cipherBuffer);

      return `${ENC_VERSION_V2}${ivBase64}.${cipherBase64}`;
    } catch (e) {
      console.error("[EncryptionService] encrypt failed:", e);
      return text;
    }
  }

  async decrypt(encryptedText: string | null | undefined): Promise<string> {
    if (!encryptedText) return "";

    // Handle V1 (Simple/Fallback)
    if (encryptedText.startsWith(ENC_VERSION_V1)) {
      try {
        const data = encryptedText.substring(ENC_VERSION_V1.length);
        return decodeURIComponent(data);
      } catch (e) {
        return encryptedText;
      }
    }

    if (!encryptedText.startsWith(ENC_VERSION_V2)) {
      return encryptedText;
    }

    try {
      const subtle = getSubtle();
      const key = await this.getCryptoKey();
      
      if (!subtle || !key) {
        throw new Error("Cannot decrypt V2 without subtle crypto");
      }

      const payload = encryptedText.substring(ENC_VERSION_V2.length);
      const dotIdx = payload.indexOf(".");

      if (dotIdx === -1) throw new Error("Invalid enc_v2 format");

      const ivBase64 = payload.substring(0, dotIdx);
      const cipherBase64 = payload.substring(dotIdx + 1);

      const iv = base64ToBuffer(ivBase64);
      const cipherBuffer = base64ToBuffer(cipherBase64);

      const plainBuffer = await subtle.decrypt(
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

  static clearKeyCache(): void {
    EncryptionService.cachedCryptoKey = null;
  }

  async exportRawMasterKey(): Promise<string> {
    let rawKeyBase64 = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);
    if (!rawKeyBase64) {
      await this.getCryptoKey();
      rawKeyBase64 = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);
    }
    return rawKeyBase64!;
  }

  async importRawMasterKey(rawKeyBase64: string): Promise<void> {
    await SecureStore.setItemAsync(MASTER_KEY_ALIAS, rawKeyBase64);
    EncryptionService.clearKeyCache();
  }
}

export const encryptionService = new EncryptionService();
