import { AppointmentRepository } from "../../../infrastructure/repositories/AppointmentRepository";
import { ClientRepository } from "../../../infrastructure/repositories/ClientRepository";
import { AppointmentService } from "../AppointmentService";

// Mock repositories to isolate logic
jest.mock("../../../infrastructure/repositories/AppointmentRepository");
jest.mock("../../../infrastructure/repositories/ClientRepository");
jest.mock("../../../infrastructure/services/ExpoNotificationService");

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
    expect(createdAppt.paymentStatus).toBe("unpaid");
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

  it("should return today's list and revenue by delegating to repository", async () => {
    const mockApptRepoToday = jest
      .spyOn(AppointmentRepository.prototype, "findToday")
      .mockResolvedValue([]);
    const mockApptRepoRev = jest
      .spyOn(AppointmentRepository.prototype, "calculateRevenueToday")
      .mockResolvedValue(1500);

    await service.listToday();
    expect(mockApptRepoToday).toHaveBeenCalled();

    const rev = await service.getRevenueToday();
    expect(mockApptRepoRev).toHaveBeenCalled();
    expect(rev).toBe(1500);
  });

  it("should update payment status by delegating to repository", async () => {
    const mockApptUpdatePayment = jest
      .spyOn(AppointmentRepository.prototype, "updatePaymentStatus")
      .mockResolvedValue(undefined);

    await service.updatePaymentStatus("appt-id-123", "paid");

    expect(mockApptUpdatePayment).toHaveBeenCalledTimes(1);
    expect(mockApptUpdatePayment).toHaveBeenCalledWith("appt-id-123", "paid");
  });

  it("should get client metrics successfully from repository", async () => {
    const mockMetrics = {
      history: [],
      totalAppointments: 5,
      cancelledAppointments: 1,
      totalDebt: 500,
      totalSpent: 0,
      nextPending: "2024-12-12T10:00:00.000Z",
    };
    const mockGetMetrics = jest
      .spyOn(AppointmentRepository.prototype, "getClientMetrics")
      .mockResolvedValue(mockMetrics);

    const result = await service.getClientMetrics("client-id-abc");

    expect(mockGetMetrics).toHaveBeenCalledTimes(1);
    expect(mockGetMetrics).toHaveBeenCalledWith("client-id-abc");
    expect(result).toEqual(mockMetrics);
  });

  it("should throw error getting client metrics if client ID is missing", async () => {
    await expect(service.getClientMetrics("")).rejects.toThrow(
      "Client ID es requerido para obtener métricas",
    );
  });
});
