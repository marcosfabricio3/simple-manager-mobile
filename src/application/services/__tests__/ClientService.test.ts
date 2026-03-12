import { ClientRepository } from "../../../infrastructure/repositories/ClientRepository";
import { ClientService } from "../ClientService";

jest.mock("../../../infrastructure/repositories/ClientRepository");

describe("ClientService (Application Layer)", () => {
  let service: ClientService;
  let mockCreate: jest.SpyInstance;
  let mockFindAll: jest.SpyInstance;
  let mockUpdate: jest.SpyInstance;
  let mockSoftDelete: jest.SpyInstance;
  let mockCountTotal: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ClientService();
    mockCreate = jest
      .spyOn(ClientRepository.prototype, "create")
      .mockResolvedValue(undefined);
    mockFindAll = jest
      .spyOn(ClientRepository.prototype, "findAll")
      .mockResolvedValue([]);
    mockUpdate = jest
      .spyOn(ClientRepository.prototype, "update")
      .mockResolvedValue(undefined);
    mockSoftDelete = jest
      .spyOn(ClientRepository.prototype, "softDelete")
      .mockResolvedValue(undefined);
    mockCountTotal = jest
      .spyOn(ClientRepository.prototype, "countTotal")
      .mockResolvedValue(5);
  });

  it("should delegate create to repository correctly", async () => {
    const client = {
      id: "mock-uuid-1234",
      name: "Ana García",
      phone: "555-1234",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    await service.create(client);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(client);
  });

  it("should delegate listAll to repository and return results", async () => {
    const fakeClients = [
      {
        id: "c1",
        name: "Carlos",
        phone: "111",
        createdAt: "",
        updatedAt: "",
        isDeleted: false,
      },
    ];
    mockFindAll.mockResolvedValueOnce(fakeClients);

    const result = await service.listAll();

    expect(mockFindAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(fakeClients);
  });

  it("should delegate getCountTotal to repository and return count", async () => {
    const count = await service.getCountTotal();

    expect(mockCountTotal).toHaveBeenCalledTimes(1);
    expect(count).toBe(5);
  });

  it("should set updatedAt before delegating update", async () => {
    const client = {
      id: "c1",
      name: "Ana",
      phone: "555",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      isDeleted: false,
    };

    const before = Date.now();
    await service.update(client);
    const after = Date.now();

    const updatedClient = mockUpdate.mock.calls[0][0];
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const updatedAt = new Date(updatedClient.updatedAt).getTime();
    expect(updatedAt).toBeGreaterThanOrEqual(before);
    expect(updatedAt).toBeLessThanOrEqual(after);
  });

  it("should delegate delete to softDelete on repository", async () => {
    await service.delete("client-id-999");

    expect(mockSoftDelete).toHaveBeenCalledTimes(1);
    expect(mockSoftDelete).toHaveBeenCalledWith("client-id-999");
  });
});
