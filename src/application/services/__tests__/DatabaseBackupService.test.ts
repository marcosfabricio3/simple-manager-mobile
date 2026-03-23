import { DatabaseBackupService } from "../DatabaseBackupService";
import * as FileSystem from "expo-file-system/legacy";
import { db } from "@/src/infrastructure/database/database";
import { encryptionService } from "../EncryptionService";
import { Alert, BackHandler, Platform } from "react-native";
import * as Sharing from "expo-sharing";
import * as Crypto from "expo-crypto";

jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file://mock/document/",
  cacheDirectory: "file://mock/cache/",
  EncodingType: { Base64: "base64", UTF8: "utf8" },
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
}));

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(32)),
  subtle: {
    importKey: jest.fn().mockResolvedValue({} as CryptoKey),
    deriveKey: jest.fn().mockResolvedValue({} as CryptoKey),
    encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
    decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
  }
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock("react-native", () => ({
  Alert: { alert: jest.fn() },
  Platform: { OS: "android" },
  BackHandler: { exitApp: jest.fn() },
}));

jest.mock("@/src/infrastructure/database/database", () => ({
  db: {
    execAsync: jest.fn(),
    closeSync: jest.fn(),
  },
}));

jest.mock("../EncryptionService", () => ({
  encryptionService: {
    exportRawMasterKey: jest.fn(),
    importRawMasterKey: jest.fn(),
  },
}));

const mockCrypto = {
  getRandomValues: (arr: any) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  },
  subtle: {
    importKey: jest.fn().mockResolvedValue({} as CryptoKey),
    deriveKey: jest.fn().mockResolvedValue({} as CryptoKey),
    encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
    decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
  },
};

Object.defineProperty(global, "crypto", {
  value: mockCrypto,
  writable: true,
});

describe("DatabaseBackupService", () => {
  let service: DatabaseBackupService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DatabaseBackupService();
  });

  describe("exportSecureBackup", () => {
    it("should verify database exists before exporting", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({ exists: false });

      await service.exportSecureBackup("password", "en");

      expect(FileSystem.getInfoAsync).toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith("Error", expect.any(String));
      expect(db.execAsync).not.toHaveBeenCalled();
    });

    it("should checkpoint WAL and export if database exists", async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue("mockBase64");
      (encryptionService.exportRawMasterKey as jest.Mock).mockResolvedValue("cGFzc3dvcmQ=");
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      ((Crypto as any).subtle.deriveKey as jest.Mock).mockResolvedValue({} as CryptoKey);
      ((Crypto as any).subtle.encrypt as jest.Mock).mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

      await service.exportSecureBackup("password", "en");

      // Verify WAL Checkpoint was called
      expect(db.execAsync).toHaveBeenCalledWith("PRAGMA wal_checkpoint(FULL);");
      expect(FileSystem.readAsStringAsync).toHaveBeenCalled();
      
      // Verify file was written to cache
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.stringContaining("file://mock/cache/simple_manager_"),
        expect.any(String),
        expect.any(Object)
      );
      
      // Verify sharing was triggered
      expect(Sharing.shareAsync).toHaveBeenCalled();
    });
  });

  describe("importSecureBackup", () => {
    let validBundle: any;

    beforeEach(() => {
      validBundle = {
        version: 2,
        app: "simple-manager",
        exportedAt: new Date().toISOString(),
        kdf: { salt: "c2FsdA==", iterations: 250000, algorithm: "PBKDF2", hash: "SHA-256" },
        encKey: { iv: "aXY=", ciphertext: "Y2lwaGVy" },
        database: "bW9ja2Ri", // mockdb
      };
    });

    it("should safely close DB, backup DB size and delete WAL files before restoring", async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(validBundle));
      ((Crypto as any).subtle.decrypt as jest.Mock).mockResolvedValue(new Uint8Array([7, 8, 9]).buffer);
      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true });

      await service.importSecureBackup("file://mock/bundle.smb", "password", "en");

      // Verify DB was closed properly
      expect(db.closeSync).toHaveBeenCalled();

      // Verify DB base64 was written
      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        "file://mock/document/SQLite/simple_manager.db",
        "bW9ja2Ri",
        expect.objectContaining({ encoding: "base64" })
      );

      // Verify WAL and SHM files were deleted
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        "file://mock/document/SQLite/simple_manager.db-wal",
        { idempotent: true }
      );
      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(
        "file://mock/document/SQLite/simple_manager.db-shm",
        { idempotent: true }
      );

      // Verify Alert was shown to inform user
      expect(Alert.alert).toHaveBeenCalledWith(
        "Restore Successful",
        expect.any(String),
        expect.any(Array)
      );

      // Simulate the Alert confirm
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      buttons[0].onPress();
      
      // Should exit app on android
      expect(BackHandler.exitApp).toHaveBeenCalled();
    });

    it("should show an error if password is wrong", async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(JSON.stringify(validBundle));
      // Simulate decrypt failure (wrong password)
      ((Crypto as any).subtle.decrypt as jest.Mock).mockRejectedValue(new Error("Decryption failed"));

      await service.importSecureBackup("file://mock/bundle.smb", "wrong", "en");

      expect(Alert.alert).toHaveBeenCalledWith(
        "Incorrect password",
        expect.any(String) // wrongPasswordMsg
      );
      // Ensure we don't restore DB
      expect(db.closeSync).not.toHaveBeenCalled();
      expect(FileSystem.writeAsStringAsync).not.toHaveBeenCalled();
    });
  });
});
