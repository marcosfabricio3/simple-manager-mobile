import { generateId } from "../../utils/id";

describe("generateId utility", () => {
  it("should return the mocked UUID from jest.setup", () => {
    const id = generateId();
    // expo-crypto.randomUUID is globally mocked in jest.setup.ts
    expect(id).toBe("mock-uuid-1234");
  });

  it("should return a string", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
  });

  it("should return a non-empty string", () => {
    const id = generateId();
    expect(id.length).toBeGreaterThan(0);
  });
});
