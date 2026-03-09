import { AppointmentRepository } from "../../../infraestructure/repositories/AppointmentRepository";
import { ClientRepository } from "../../../infraestructure/repositories/ClientRepository";
import { AppointmentService } from "../AppointmentService";

// Mock repositories to isolate logic
jest.mock("../../../infraestructure/repositories/AppointmentRepository");
jest.mock("../../../infraestructure/repositories/ClientRepository");

describe("AppointmentService (Application Layer)", () => {
  let service: AppointmentService;
  let mockApptRepoCreate: jest.SpyInstance;
  let mockClientRepoCreate: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AppointmentService();
    mockApptRepoCreate = jest
      .spyOn(AppointmentRepository.prototype, "create")
      .mockResolvedValue(undefined);
    mockClientRepoCreate = jest
      .spyOn(ClientRepository.prototype, "create")
      .mockResolvedValue(undefined);
  });

  it("should create a client and an appointment successfully", async () => {
    // A valid ISO Date that is precisely right now
    const validIsoDate = new Date().toISOString();

    // Attempt creation
    await service.createWithClient(
      "John Doe",
      "1234567890",
      validIsoDate,
      60,
      ["service-id-1", "service-id-2"],
      "First visit",
    );

    // Assert Client was created
    expect(mockClientRepoCreate).toHaveBeenCalledTimes(1);
    const createdClient = mockClientRepoCreate.mock.calls[0][0];
    expect(createdClient.id).toBe("mock-uuid-1234");
    expect(createdClient.name).toBe("John Doe");

    // Assert Appointment was created
    expect(mockApptRepoCreate).toHaveBeenCalledTimes(1);
    const createdAppt = mockApptRepoCreate.mock.calls[0][0];
    const serviceIds = mockApptRepoCreate.mock.calls[0][1];

    expect(createdAppt.clientId).toBe(createdClient.id);
    expect(createdAppt.durationMinutes).toBe(60);
    expect(createdAppt.status).toBe("pending");
    expect(serviceIds).toEqual(["service-id-1", "service-id-2"]);
    expect(createdAppt.notes).toBe("First visit");
  });

  it("should throw an error if client name is empty", async () => {
    const validIsoDate = new Date().toISOString();
    await expect(
      service.createWithClient("   ", "1234", validIsoDate, 30, [], ""),
    ).rejects.toThrow("Nombre del cliente es requerido.");

    expect(mockClientRepoCreate).not.toHaveBeenCalled();
    expect(mockApptRepoCreate).not.toHaveBeenCalled();
  });

  it("should throw an error if the date format is invalid", async () => {
    await expect(
      service.createWithClient("John", "", "", 30, ["s1"], ""),
    ).rejects.toThrow("Fecha del turno es requerida.");

    expect(mockClientRepoCreate).not.toHaveBeenCalled();
  });

  it("should throw an error if no services are selected", async () => {
    const validDate = new Date().toISOString();
    await expect(
      service.createWithClient("John", "", validDate, 30, [], ""),
    ).rejects.toThrow("Debes seleccionar al menos un servicio.");

    expect(mockClientRepoCreate).not.toHaveBeenCalled();
  });
});
