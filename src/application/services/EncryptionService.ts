import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import CryptoJS from "crypto-js";

/**
 * Versioning allows future key-rotation and algorithm migrations without
 * breaking existing encrypted data.
 */
const MASTER_KEY_ALIAS = "v2.aes256gcm.master.key";
const ENC_VERSION_V2 = "enc_v2:"; // CryptoJS AES-256
const ENC_VERSION_V1 = "enc_v1:"; // Legacy Base64 obfuscation

export class EncryptionService {
  private static cachedMasterKey: string | null = null;

  private async getMasterKey(): Promise<string> {
    if (EncryptionService.cachedMasterKey) {
      return EncryptionService.cachedMasterKey;
    }

    let rawKeyBase64 = await SecureStore.getItemAsync(MASTER_KEY_ALIAS);

    if (!rawKeyBase64) {
      // Use expo-crypto only for random byte generation (stable)
      const keyBytes = await Crypto.getRandomBytesAsync(32);
      rawKeyBase64 = CryptoJS.lib.WordArray.create(keyBytes as any).toString(CryptoJS.enc.Base64);
      await SecureStore.setItemAsync(MASTER_KEY_ALIAS, rawKeyBase64);
    }

    EncryptionService.cachedMasterKey = rawKeyBase64;
    return rawKeyBase64;
  }

  async encrypt(text: string): Promise<string> {
    if (!text) return text;

    try {
      const key = await this.getMasterKey();
      
      // Use CryptoJS for stable cross-platform encryption
      const encrypted = CryptoJS.AES.encrypt(text, key);
      return `${ENC_VERSION_V2}${encrypted.toString()}`;
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

    // Handle V2 (CryptoJS)
    if (encryptedText.startsWith(ENC_VERSION_V2)) {
      try {
        const key = await this.getMasterKey();
        const ciphertext = encryptedText.substring(ENC_VERSION_V2.length);
        const decrypted = CryptoJS.AES.decrypt(ciphertext, key);
        return decrypted.toString(CryptoJS.enc.Utf8);
      } catch (e) {
        console.error("[EncryptionService] decrypt failed:", e);
        return encryptedText;
      }
    }

    return encryptedText;
  }

  static clearKeyCache(): void {
    EncryptionService.cachedMasterKey = null;
  }

  async exportRawMasterKey(): Promise<string> {
    return await this.getMasterKey();
  }

  async importRawMasterKey(rawKeyBase64: string): Promise<void> {
    await SecureStore.setItemAsync(MASTER_KEY_ALIAS, rawKeyBase64);
    EncryptionService.clearKeyCache();
  }
}

export const encryptionService = new EncryptionService();
