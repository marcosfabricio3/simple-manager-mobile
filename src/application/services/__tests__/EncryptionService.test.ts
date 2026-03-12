/**
 * EncryptionService Tests — AES-256-GCM
 *
 * crypto.subtle is mocked with a symmetric XOR cipher so the round-trip
 * (encrypt → decrypt) can be verified in the Node/Jest environment without
 * needing real WebCrypto native support.
 */

// --- Mock expo-secure-store ---
jest.mock("expo-secure-store", () => {
  const store: Record<string, string> = {};
  return {
    getItemAsync: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    setItemAsync: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
  };
});

// --- Mock expo-crypto ---
jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "mock-uuid-1234"),
  getRandomBytesAsync: jest.fn((size: number) =>
    Promise.resolve(new Uint8Array(size).fill(0xab)),
  ),
}));

// ---------------------------------------------------------------------------
// Mock crypto.subtle BEFORE importing the module under test.
// XOR is its own inverse so encrypt(decrypt(x)) = x — ideal for testing.
// ---------------------------------------------------------------------------
const mockXorCipher = async (
  algo: { iv: ArrayBuffer },
  _key: CryptoKey,
  data: ArrayBuffer,
): Promise<ArrayBuffer> => {
  const ivArr = new Uint8Array(algo.iv);
  const bytes = new Uint8Array(data);
  return bytes.map((b, i) => b ^ ivArr[i % ivArr.length]).buffer;
};

Object.defineProperty(global, "crypto", {
  value: {
    subtle: {
      importKey: jest.fn(
        async (
          _format: string,
          keyData: ArrayBuffer,
          _algo: AesKeyGenParams,
          _extractable: boolean,
          _usages: string[],
        ) => ({ type: "secret", rawForTest: keyData }) as unknown as CryptoKey,
      ),
      encrypt: jest.fn(mockXorCipher),
      decrypt: jest.fn(mockXorCipher),
    },
  },
  configurable: true,
  writable: true,
});

// ---------------------------------------------------------------------------
// Now import the module under test
// ---------------------------------------------------------------------------
import { EncryptionService } from "../EncryptionService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getSecureStore() {
  return jest.requireMock("expo-secure-store");
}
function getExpoCrypto() {
  return jest.requireMock("expo-crypto");
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe("EncryptionService (AES-256-GCM)", () => {
  let service: EncryptionService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Restore default implementations after clearAllMocks
    getExpoCrypto().getRandomBytesAsync.mockImplementation((size: number) =>
      Promise.resolve(new Uint8Array(size).fill(0xab)),
    );
    getSecureStore().getItemAsync.mockResolvedValue(null);
    getSecureStore().setItemAsync.mockResolvedValue(undefined);

    // Reset mock crypto.subtle to XOR implementation
    (crypto.subtle.encrypt as jest.Mock).mockImplementation(mockXorCipher);
    (crypto.subtle.decrypt as jest.Mock).mockImplementation(mockXorCipher);
    (crypto.subtle.importKey as jest.Mock).mockImplementation(
      async (_f: string, keyData: ArrayBuffer) =>
        ({ type: "secret", rawForTest: keyData }) as unknown as CryptoKey,
    );

    // Clear cached key so each test starts fresh
    EncryptionService.clearKeyCache();

    service = new EncryptionService();
  });

  // -------------------------------------------------------------------------
  // Round-trip tests
  // -------------------------------------------------------------------------

  it("should round-trip a simple ASCII string", async () => {
    const original = "Juan Perez";
    const encrypted = await service.encrypt(original);
    const decrypted = await service.decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should round-trip a string with accented characters", async () => {
    const original = "María José Ñoño";
    const encrypted = await service.encrypt(original);
    const decrypted = await service.decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should round-trip a phone number string", async () => {
    const original = "+54 9 11 1234-5678";
    const encrypted = await service.encrypt(original);
    const decrypted = await service.decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should round-trip a long text (notes field)", async () => {
    const original =
      "Observación: cliente con historial desde 2020. Preferencias especiales de atención.";
    const encrypted = await service.encrypt(original);
    const decrypted = await service.decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  // -------------------------------------------------------------------------
  // Format verification
  // -------------------------------------------------------------------------

  it("encrypted string should start with enc_v2:", async () => {
    const encrypted = await service.encrypt("hello");
    expect(encrypted.startsWith("enc_v2:")).toBe(true);
  });

  it("payload after enc_v2: should have exactly two dot-separated parts (iv + ciphertext)", async () => {
    const encrypted = await service.encrypt("hello");
    const payload = encrypted.slice("enc_v2:".length);
    const parts = payload.split(".");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // IV uniqueness (probabilistic security check)
  // -------------------------------------------------------------------------

  it("should produce different ciphertexts for the same plaintext (unique IV per call)", async () => {
    let counter = 0;
    getExpoCrypto().getRandomBytesAsync.mockImplementation((size: number) => {
      counter++;
      return Promise.resolve(new Uint8Array(size).fill(counter));
    });

    const enc1 = await service.encrypt("hello");
    const enc2 = await service.encrypt("hello");
    expect(enc1).not.toBe(enc2);
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------

  it("should return empty string when encrypting empty string", async () => {
    expect(await service.encrypt("")).toBe("");
  });

  it("should return empty string when decrypting null", async () => {
    expect(await service.decrypt(null)).toBe("");
  });

  it("should return empty string when decrypting undefined", async () => {
    expect(await service.decrypt(undefined)).toBe("");
  });

  it("should return the input as-is for unrecognized format (no prefix)", async () => {
    const result = await service.decrypt("some unencrypted text");
    expect(result).toBe("some unencrypted text");
  });

  // -------------------------------------------------------------------------
  // Legacy enc_v1 migration
  // -------------------------------------------------------------------------

  it("should decrypt legacy enc_v1 Base64 data (ASCII)", async () => {
    const original = "legacy data";
    const legacyStr = `enc_v1:${btoa(unescape(encodeURIComponent(original)))}`;
    expect(await service.decrypt(legacyStr)).toBe(original);
  });

  it("should decrypt legacy enc_v1 Base64 data (with Spanish accents)", async () => {
    const original = "José García";
    const legacyStr = `enc_v1:${btoa(unescape(encodeURIComponent(original)))}`;
    expect(await service.decrypt(legacyStr)).toBe(original);
  });

  // -------------------------------------------------------------------------
  // Key management
  // -------------------------------------------------------------------------

  it("should store a new key in SecureStore on first encrypt", async () => {
    await service.encrypt("test");
    expect(getSecureStore().setItemAsync).toHaveBeenCalledTimes(1);
  });

  it("should not store a new key if one already exists in SecureStore", async () => {
    // Simulate pre-existing key
    const existingKey = btoa(String.fromCharCode(...new Array(32).fill(0xcd)));
    getSecureStore().getItemAsync.mockResolvedValue(existingKey);

    await service.encrypt("test");

    expect(getSecureStore().setItemAsync).not.toHaveBeenCalled();
  });

  it("should reuse the in-memory cached key across multiple calls", async () => {
    await service.encrypt("first");
    await service.encrypt("second");
    await service.encrypt("third");

    // setItemAsync should only be called once (initial key creation)
    expect(getSecureStore().setItemAsync).toHaveBeenCalledTimes(1);
    // importKey should only be called once (initial import)
    expect(crypto.subtle.importKey).toHaveBeenCalledTimes(1);
  });

  it("clearKeyCache() should remove the cached CryptoKey", () => {
    (EncryptionService as any).cachedCryptoKey = {
      type: "secret",
    } as CryptoKey;
    EncryptionService.clearKeyCache();
    expect((EncryptionService as any).cachedCryptoKey).toBeNull();
  });
});
