import { encryptionService } from "@/src/application/services/EncryptionService";
import { db, reinitializeDatabase } from "@/src/infrastructure/database/database";
import {
  Language,
  translations,
} from "@/src/presentation/translations/translations";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Crypto from "expo-crypto";
import CryptoJS from "crypto-js";
import { Alert, BackHandler, Platform } from "react-native";

const DB_NAME = "simple_manager.db";
const BACKUP_EXTENSION = ".smb";
const BUNDLE_VERSION = 3; // Upgraded version for SJCL/CryptoJS
const PBKDF2_ITERATIONS = 10000; // Adjusted for JS performance balance

// ---------------------------------------------------------------------------
// Backup bundle type
// ---------------------------------------------------------------------------

interface BackupBundle {
  version: number;
  app: string;
  exportedAt: string;
  kdf: {
    algorithm: "PBKDF2";
    hash: "SHA256";
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
  private t(lang: Language) {
    return translations[lang];
  }

  private get dbPath(): string {
    // @ts-ignore
    return `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;
  }

  /**
   * Derives a KEK (Key Encryption Key) from a passphrase using PBKDF2.
   */
  private deriveKek(passphrase: string, salt: string): CryptoJS.lib.WordArray {
    return CryptoJS.PBKDF2(passphrase, CryptoJS.enc.Base64.parse(salt), {
      keySize: 256 / 32,
      iterations: PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    });
  }

  async exportSecureBackup(
    passphrase: string,
    language: Language,
  ): Promise<void> {
    const { backup, common } = this.t(language);

    try {
      const fileInfo = await FileSystem.getInfoAsync(this.dbPath);
      if (!fileInfo.exists) {
        Alert.alert(common.error, backup.noDatabase);
        return;
      }

      await db.execAsync("PRAGMA wal_checkpoint(FULL);");
      const dbBase64 = await FileSystem.readAsStringAsync(this.dbPath, {
        // @ts-ignore
        encoding: FileSystem.EncodingType.Base64,
      });

      // 1. Generate random salt using expo-crypto (stable entropy source)
      const saltBytes = await Crypto.getRandomBytesAsync(16);
      const salt = CryptoJS.lib.WordArray.create(saltBytes as any).toString(CryptoJS.enc.Base64);
      
      // 2. Derive KEK
      const kek = this.deriveKek(passphrase, salt);

      // 3. Get master key and wrap it
      const rawKeyBase64 = await encryptionService.exportRawMasterKey();
      
      // Encrypt the master key using AES
      const ivBytes = await Crypto.getRandomBytesAsync(16);
      const iv = CryptoJS.lib.WordArray.create(ivBytes as any);
      const encrypted = CryptoJS.AES.encrypt(rawKeyBase64, kek, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      const bundle: BackupBundle = {
        version: BUNDLE_VERSION,
        app: "simple-manager",
        exportedAt: new Date().toISOString(),
        kdf: {
          algorithm: "PBKDF2",
          hash: "SHA256",
          iterations: PBKDF2_ITERATIONS,
          salt: salt,
        },
        encKey: {
          iv: iv.toString(CryptoJS.enc.Base64),
          ciphertext: encrypted.toString(),
        },
        database: dbBase64,
      };

      const bundleJson = JSON.stringify(bundle);
      const backupDate = new Date().toISOString().split("T")[0];
      const exportFileName = `simple_manager_${backupDate}${BACKUP_EXTENSION}`;
      // @ts-ignore
      const exportPath = `${FileSystem.cacheDirectory}${exportFileName}`;

      await FileSystem.writeAsStringAsync(exportPath, bundleJson, {
        // @ts-ignore
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (!(await Sharing.isAvailableAsync())) {
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

  async importSecureBackup(
    fileUri: string,
    passphrase: string,
    language: Language,
  ): Promise<void> {
    const { backup, common } = this.t(language);

    try {
      const bundleJson = await FileSystem.readAsStringAsync(fileUri, {
        // @ts-ignore
        encoding: FileSystem.EncodingType.UTF8,
      });

      const bundle: BackupBundle = JSON.parse(bundleJson);

      if (bundle.app !== "simple-manager") {
        Alert.alert(common.attention, backup.incompatibleVersion);
        return;
      }

      // Handle legacy versions if needed, but here we focus on fixing current
      if (bundle.version < 3) {
        Alert.alert(common.error, "Este respaldo es de una versión antigua no compatible.");
        return;
      }

      // 1. Derive KEK
      const kek = this.deriveKek(passphrase, bundle.kdf.salt);

      // 2. Unwrap key
      let rawKeyBase64: string;
      try {
        const decrypted = CryptoJS.AES.decrypt(bundle.encKey.ciphertext, kek, {
          iv: CryptoJS.enc.Base64.parse(bundle.encKey.iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });
        rawKeyBase64 = decrypted.toString(CryptoJS.enc.Utf8);
        
        if (!rawKeyBase64) throw new Error("Decryption failed");
      } catch {
        Alert.alert(backup.wrongPassword, backup.wrongPasswordMsg);
        return;
      }

      // 3. Restore DB
      reinitializeDatabase(); // Closes AND reopens the reference

      // @ts-ignore
      const dbDirectory = `${FileSystem.documentDirectory}SQLite`;
      await FileSystem.makeDirectoryAsync(dbDirectory, { intermediates: true });

      await FileSystem.writeAsStringAsync(this.dbPath, bundle.database, {
        // @ts-ignore
        encoding: FileSystem.EncodingType.Base64,
      });

      try {
        await FileSystem.deleteAsync(`${this.dbPath}-wal`, { idempotent: true });
        await FileSystem.deleteAsync(`${this.dbPath}-shm`, { idempotent: true });
      } catch {}

      // 4. Restore Master Key
      await encryptionService.importRawMasterKey(rawKeyBase64);

      Alert.alert(backup.importSuccess, backup.importSuccessMsg, [
        {
          text: common.understood,
          onPress: () => {
            if (Platform.OS === "android") BackHandler.exitApp();
          },
        },
      ]);
    } catch (error) {
      console.error("[DatabaseBackupService] import failed:", error);
      Alert.alert(common.error, backup.importError);
    }
  }

  async pickBackupFile(language: Language): Promise<string | null> {
    const { backup } = this.t(language);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return null;
      const file = result.assets[0];

      if (!file.name.endsWith(BACKUP_EXTENSION)) {
        Alert.alert(backup.invalidFileTitle, backup.invalidFileMsg);
        return null;
      }

      return file.uri;
    } catch (error) {
      console.error("[DatabaseBackupService] pick failed:", error);
      return null;
    }
  }
}
