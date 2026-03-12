/**
 * DatabaseBackupService — Secure Portable Backup
 *
 * Backup format: ".smb" (Simple Manager Backup) — a JSON bundle containing:
 *   {
 *     version, exportedAt,
 *     kdf:  { salt, iterations },           // PBKDF2 params
 *     encKey: { iv, ciphertext },           // AES key wrapped with passphrase
 *     database: "<base64 sqlite file>"
 *   }
 *
 * Security model:
 *   1. User provides a passphrase.
 *   2. PBKDF2-SHA256 (250 000 iterations) derives a Key-Encryption-Key (KEK).
 *   3. KEK wraps the AES-256-GCM master key (from EncryptionService) with AES-256-GCM.
 *   4. The wrapped key + the SQLite file are packed into the .smb bundle and shared.
 *
 *   On restore:
 *   1. User picks the .smb file and enters passphrase.
 *   2. PBKDF2 re-derives KEK, decrypts master key.
 *   3. Master key is stored in SecureStore, replacing the current key.
 *   4. SQLite file is restored to disk.
 */

import { encryptionService } from "@/src/application/services/EncryptionService";
import {
  Language,
  translations,
} from "@/src/presentation/translations/translations";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

const DB_NAME = "simple_manager.db";
const BACKUP_EXTENSION = ".smb";
const BUNDLE_VERSION = 2;
const PBKDF2_ITERATIONS = 250_000;

// ---------------------------------------------------------------------------
// Low-level crypto helpers
// ---------------------------------------------------------------------------

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives a 256-bit AES-GCM Key-Encryption-Key from a user passphrase.
 * Uses PBKDF2 with a random salt and 250 000 iterations of SHA-256.
 */
async function deriveKekFromPassphrase(
  passphrase: string,
  salt: ArrayBuffer,
): Promise<CryptoKey> {
  const passphraseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passphraseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/**
 * Wraps raw key bytes with a passphrase-derived key using AES-256-GCM.
 */
async function wrapKey(
  rawKeyBase64: string,
  kek: CryptoKey,
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)).buffer;
  const rawKeyBuffer = base64ToBuffer(rawKeyBase64);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    kek,
    rawKeyBuffer,
  );

  return {
    iv: bufferToBase64(iv),
    ciphertext: bufferToBase64(cipherBuffer),
  };
}

/**
 * Unwraps a passphrase-encrypted master key.
 */
async function unwrapKey(
  ivBase64: string,
  ciphertextBase64: string,
  kek: CryptoKey,
): Promise<string> {
  const iv = base64ToBuffer(ivBase64);
  const cipherBuffer = base64ToBuffer(ciphertextBase64);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    kek,
    cipherBuffer,
  );

  return bufferToBase64(plainBuffer);
}

// ---------------------------------------------------------------------------
// Backup bundle type
// ---------------------------------------------------------------------------

interface BackupBundle {
  version: number;
  app: string;
  exportedAt: string;
  kdf: {
    algorithm: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
  };
  encKey: {
    iv: string;
    ciphertext: string;
  };
  database: string;
}

// ---------------------------------------------------------------------------
// DatabaseBackupService
// ---------------------------------------------------------------------------

export class DatabaseBackupService {
  /** All user-facing strings come from translations — no hardcoded text. */
  private t(lang: Language) {
    return translations[lang];
  }

  private get dbPath(): string {
    // @ts-ignore
    return `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
  }

  // -------------------------------------------------------------------------
  // Export
  // -------------------------------------------------------------------------

  /**
   * Exports a password-protected .smb backup bundle.
   * All Alert messages appear in the user's selected language.
   */
  async exportSecureBackup(
    passphrase: string,
    language: Language,
  ): Promise<void> {
    const { backup, common } = this.t(language);

    try {
      // 1. Verify the DB file exists
      const fileInfo = await FileSystem.getInfoAsync(this.dbPath);
      if (!fileInfo.exists) {
        Alert.alert(common.error, backup.noDatabase);
        return;
      }

      // 2. Read the SQLite file as base64
      const dbBase64 = await FileSystem.readAsStringAsync(this.dbPath, {
        // @ts-ignore
        encoding: FileSystem.EncodingType.Base64,
      });

      // 3. Derive KEK from passphrase
      const saltBytes = crypto.getRandomValues(new Uint8Array(32));
      const salt = saltBytes.buffer;
      const kek = await deriveKekFromPassphrase(passphrase, salt);

      // 4. Get and wrap the master encryption key
      const rawKeyBase64 = await encryptionService.exportRawMasterKey();
      const { iv: keyIv, ciphertext: keyCiphertext } = await wrapKey(
        rawKeyBase64,
        kek,
      );

      // 5. Build bundle
      const bundle: BackupBundle = {
        version: BUNDLE_VERSION,
        app: "simple-manager",
        exportedAt: new Date().toISOString(),
        kdf: {
          algorithm: "PBKDF2",
          hash: "SHA-256",
          iterations: PBKDF2_ITERATIONS,
          salt: bufferToBase64(salt),
        },
        encKey: { iv: keyIv, ciphertext: keyCiphertext },
        database: dbBase64,
      };

      const bundleJson = JSON.stringify(bundle);

      // 6. Write to cache and share
      const backupDate = new Date().toISOString().split("T")[0];
      const exportFileName = `simple_manager_${backupDate}${BACKUP_EXTENSION}`;
      // @ts-ignore
      const exportPath = `${FileSystem.cacheDirectory}${exportFileName}`;

      await FileSystem.writeAsStringAsync(exportPath, bundleJson, {
        // @ts-ignore
        encoding: FileSystem.EncodingType.UTF8,
      });

      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        Alert.alert(common.attention, backup.sharingUnavailable);
        return;
      }

      await Sharing.shareAsync(exportPath, {
        mimeType: "application/json",
        dialogTitle: backup.exportTitle,
      });
    } catch (error) {
      console.error("[DatabaseBackupService] export failed:", error);
      Alert.alert(common.error, backup.exportError);
    }
  }

  // -------------------------------------------------------------------------
  // Import
  // -------------------------------------------------------------------------

  /**
   * Imports a .smb backup bundle and restores the database and encryption key.
   */
  async importSecureBackup(
    fileUri: string,
    passphrase: string,
    language: Language,
  ): Promise<void> {
    const { backup, common } = this.t(language);

    try {
      // 1. Read bundle
      const bundleJson = await FileSystem.readAsStringAsync(fileUri, {
        // @ts-ignore
        encoding: FileSystem.EncodingType.UTF8,
      });

      let bundle: BackupBundle;
      try {
        bundle = JSON.parse(bundleJson);
      } catch {
        Alert.alert(backup.invalidFileTitle, backup.invalidFile);
        return;
      }

      if (
        bundle.version !== BUNDLE_VERSION ||
        bundle.app !== "simple-manager"
      ) {
        Alert.alert(common.attention, backup.incompatibleVersion);
        return;
      }

      // 2. Derive KEK
      const salt = base64ToBuffer(bundle.kdf.salt);
      let kek: CryptoKey;
      try {
        kek = await deriveKekFromPassphrase(passphrase, salt);
      } catch {
        Alert.alert(common.error, backup.processPasswordError);
        return;
      }

      // 3. Unwrap master key (auth tag failure = wrong password)
      let rawKeyBase64: string;
      try {
        rawKeyBase64 = await unwrapKey(
          bundle.encKey.iv,
          bundle.encKey.ciphertext,
          kek,
        );
      } catch {
        Alert.alert(backup.wrongPassword, backup.wrongPasswordMsg);
        return;
      }

      // 4. Restore the SQLite database file
      // @ts-ignore
      const dbDirectory = `${FileSystem.documentDirectory}SQLite`;
      const dirInfo = await FileSystem.getInfoAsync(dbDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dbDirectory, {
          intermediates: true,
        });
      }

      await FileSystem.writeAsStringAsync(this.dbPath, bundle.database, {
        // @ts-ignore
        encoding: FileSystem.EncodingType.Base64,
      });

      // 5. Restore master key into SecureStore
      await encryptionService.importRawMasterKey(rawKeyBase64);

      Alert.alert(backup.importSuccess, backup.importSuccessMsg, [
        { text: common.understood },
      ]);
    } catch (error) {
      console.error("[DatabaseBackupService] import failed:", error);
      Alert.alert(common.error, backup.importError);
    }
  }

  // -------------------------------------------------------------------------
  // File picker helper
  // -------------------------------------------------------------------------

  /**
   * Opens the document picker and returns the URI of the selected .smb file.
   */
  async pickBackupFile(language: Language): Promise<string | null> {
    const { backup } = this.t(language);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return null;

      const file = result.assets[0];

      if (!file.name.endsWith(BACKUP_EXTENSION) && !file.name.endsWith(".db")) {
        Alert.alert(backup.invalidFileTitle, backup.invalidFileMsg);
        return null;
      }

      // Legacy .db files no longer supported
      if (file.name.endsWith(".db")) {
        Alert.alert(backup.legacyFormatTitle, backup.legacyFormatMsg);
        return null;
      }

      return file.uri;
    } catch (error) {
      console.error("[DatabaseBackupService] file pick failed:", error);
      return null;
    }
  }
}
