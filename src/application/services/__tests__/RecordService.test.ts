import { RecordRepository } from "../../../infrastructure/repositories/RecordRepository";
import { RecordService } from "../RecordService";

jest.mock("../../../infrastructure/repositories/RecordRepository");

describe("RecordService (Application Layer)", () => {
  let service: RecordService;
  let mockCreate: jest.SpyInstance;
  let mockFindAll: jest.SpyInstance;
  let mockUpdate: jest.SpyInstance;
  let mockSoftDelete: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RecordService();
    mockCreate = jest
      .spyOn(RecordRepository.prototype, "create")
      .mockResolvedValue(undefined);
    mockFindAll = jest
      .spyOn(RecordRepository.prototype, "findAll")
      .mockResolvedValue([]);
    mockUpdate = jest
      .spyOn(RecordRepository.prototype, "update")
      .mockResolvedValue(undefined);
    mockSoftDelete = jest
      .spyOn(RecordRepository.prototype, "softDelete")
      .mockResolvedValue(undefined);
  });

  it("should create a record with a generated id, title and type", async () => {
    const result = await service.create("Historial 2024", "client-note");

    expect(result.id).toBe("mock-uuid-1234");
    expect(result.title).toBe("Historial 2024");
    expect(result.type).toBe("client-note");
    expect(result.isDeleted).toBe(false);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(result);
  });

  it("should delegate list to repository and return results", async () => {
    const fakeRecords = [
      {
        id: "r1",
        title: "Nota 1",
        type: "note",
        createdAt: "",
        updatedAt: "",
        isDeleted: false,
      },
    ];
    mockFindAll.mockResolvedValueOnce(fakeRecords);

    const result = await service.list();

    expect(mockFindAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeRecords);
  });

  it("should delegate delete to softDelete on repository", async () => {
    await service.delete("record-id-abc");

    expect(mockSoftDelete).toHaveBeenCalledTimes(1);
    expect(mockSoftDelete).toHaveBeenCalledWith("record-id-abc");
  });

  it("should update updatedAt before delegating to repository", async () => {
    const record = {
      id: "r1",
      title: "Nota",
      type: "note",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      isDeleted: false,
    };

    const before = Date.now();
    await service.update(record);
    const after = Date.now();

    const updatedRecord = mockUpdate.mock.calls[0][0];
    const updatedAt = new Date(updatedRecord.updatedAt).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(before);
    expect(updatedAt).toBeLessThanOrEqual(after);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it("should return true if a record with the same title exists", async () => {
    mockFindAll.mockResolvedValueOnce([
      {
        id: "r1",
        title: "Nota especial",
        type: "note",
        createdAt: "",
        updatedAt: "",
        isDeleted: false,
      },
    ]);

    const exists = await service.existsByTitle("nota especial"); // case-insensitive
    expect(exists).toBe(true);
  });

  it("should return false if no record with that title exists", async () => {
    mockFindAll.mockResolvedValueOnce([]);

    const exists = await service.existsByTitle("NoExiste");
    expect(exists).toBe(false);
  });
});
