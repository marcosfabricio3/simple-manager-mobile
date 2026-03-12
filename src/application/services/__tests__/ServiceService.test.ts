import { ServiceRepository } from "../../../infrastructure/repositories/ServiceRepository";
import { ServiceService } from "../ServiceService";

// Mock the repository to isolate Application layer logic
jest.mock("../../../infrastructure/repositories/ServiceRepository");

describe("ServiceService (Application Layer)", () => {
  let service: ServiceService;
  let mockRepoCreate: jest.SpyInstance;

  beforeEach(() => {
    // Clear old mock data
    jest.clearAllMocks();
    service = new ServiceService();
    mockRepoCreate = jest
      .spyOn(ServiceRepository.prototype, "create")
      .mockResolvedValue(undefined);
  });

  it("should create a valid service with default color if empty", async () => {
    const result = await service.create("Consulta General", 1500, "");

    // Validations
    expect(result.name).toBe("Consulta General");
    expect(result.defaultPrice).toBe(1500);
    expect(result.color).toBe("#007AFF"); // fallback applied
    expect(result.isActive).toBe(true);
    expect(result.id).toBe("mock-uuid-1234"); // from our global crypto mock

    // Verify it called the infrastructure layer correctly
    expect(mockRepoCreate).toHaveBeenCalledTimes(1);
    expect(mockRepoCreate).toHaveBeenCalledWith(result);
  });

  it("should throw an error if the service name is empty", async () => {
    await expect(service.create("   ", 1500, "#FFF")).rejects.toThrow(
      "El nombre no puede estar vacío",
    );
    expect(mockRepoCreate).not.toHaveBeenCalled();
  });

  it("should throw an error if the default price is negative", async () => {
    await expect(service.create("Consulta", -500, "#FFF")).rejects.toThrow(
      "El precio no puede ser negativo",
    );
    expect(mockRepoCreate).not.toHaveBeenCalled();
  });

  it("should trim the name and color strings properly", async () => {
    const result = await service.create("  Terapia   ", 2000, "  #FF0000  ");
    expect(result.name).toBe("Terapia");
    expect(result.color).toBe("#FF0000");
  });
});
