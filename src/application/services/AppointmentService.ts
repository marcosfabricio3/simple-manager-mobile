import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import {
  Appointment
} from "../../domain/entities/Appointment";
import { Client } from "../../domain/entities/Client";
import { AppointmentRepository } from "../../infrastructure/repositories/AppointmentRepository";
import { ClientRepository } from "../../infrastructure/repositories/ClientRepository";
import { ExpoNotificationService } from "../../infrastructure/services/ExpoNotificationService";
import { generateId } from "../utils/id";

export class AppointmentService {
  private appointmentRepo = new AppointmentRepository();
  private clientRepo = new ClientRepository();
  private notificationService = new ExpoNotificationService();

  private async scheduleReminder(appointment: Appointment, clientName: string) {
    const { notificationsEnabled, notificationAdvanceMin } =
      useSettingsStore.getState();

    if (!notificationsEnabled) {
      return; // Do not schedule if user disabled notifications globally
    }

    const triggerDate = new Date(appointment.date);
    triggerDate.setMinutes(triggerDate.getMinutes() - notificationAdvanceMin);

    await this.notificationService.scheduleNotificationAsync(
      appointment.id,
      "Turno Próximo",
      `Tienes un turno con ${clientName} a las ${triggerDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`,
      triggerDate,
    );
  }

  /**
   * Creates an appointment. Creates the client on the fly if it doesn't exist.
   */
  async createWithClient(
    clientName: string,
    clientPhone: string,
    dateIsoString: string,
    durationMinutes: number,
    serviceIds: string[],
    notes?: string,
  ) {
    if (!clientName.trim()) throw new Error("Nombre del cliente es requerido.");
    if (!dateIsoString) throw new Error("Fecha del turno es requerida.");
    if (serviceIds.length === 0)
      throw new Error("Debes seleccionar al menos un servicio.");

    const now = new Date().toISOString();

    // 1. Handle Client Creation
    const client: Client = {
      id: generateId(),
      name: clientName.trim(),
      phone: clientPhone.trim() || "Sin teléfono",
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    await this.clientRepo.create(client);

    // 2. Handle Appointment
    const appointment: Appointment = {
      id: generateId(),
      clientId: client.id,
      date: dateIsoString,
      durationMinutes,
      status: "pending",
      paymentStatus: "unpaid",
      notes: notes?.trim() || "",
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    // 3. Persist atomically
    await this.appointmentRepo.create(appointment, serviceIds);

    // 4. Schedule Notification
    await this.scheduleReminder(appointment, client.name);
  }

  /**
   * Creates an appointment linking it to an already existing client.
   */
  async createWithExistingClient(
    clientId: string,
    dateIsoString: string,
    durationMinutes: number,
    serviceIds: string[],
    notes?: string,
  ) {
    if (!clientId) throw new Error("Debes seleccionar un cliente válido.");
    if (!dateIsoString) throw new Error("Fecha del turno es requerida.");
    if (serviceIds.length === 0)
      throw new Error("Debes seleccionar al menos un servicio.");

    const now = new Date().toISOString();

    const appointment: Appointment = {
      id: generateId(),
      clientId: clientId, // Use the proper ID
      date: dateIsoString,
      durationMinutes,
      status: "pending",
      paymentStatus: "unpaid",
      notes: notes,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    await this.appointmentRepo.create(appointment, serviceIds);

    const client = await this.clientRepo.findById(clientId);
    if (client) {
      await this.scheduleReminder(appointment, client.name);
    }
  }

  async listUpcoming() {
    return await this.appointmentRepo.findUpcoming();
  }

  async listToday() {
    return await this.appointmentRepo.findToday();
  }

  async listBetweenDates(startDateIso: string, endDateIso: string) {
    return await this.appointmentRepo.findBetweenDates(
      startDateIso,
      endDateIso,
    );
  }

  async getRevenueToday(): Promise<number> {
    return await this.appointmentRepo.calculateRevenueToday();
  }

  async delete(id: string) {
    await this.appointmentRepo.softDelete(id);
    await this.notificationService.cancelNotificationAsync(id);
  }

  async updatePaymentStatus(id: string, status: "paid" | "unpaid") {
    await this.appointmentRepo.updatePaymentStatus(id, status);
  }

  async updateStatus(
    id: string,
    status: "pending" | "completed" | "cancelled",
  ) {
    await this.appointmentRepo.updateStatus(id, status);
  }

  async update(
    id: string,
    dateIsoString: string,
    durationMinutes: number,
    serviceIds: string[],
    notes?: string,
  ) {
    if (!id) throw new Error("ID de turno requerido");
    if (!dateIsoString) throw new Error("Fecha del turno es requerida");
    if (serviceIds.length === 0)
      throw new Error("Selecciona al menos un servicio");

    const appt = await this.appointmentRepo.findById(id);
    if (!appt) throw new Error("Turno no encontrado");

    const updatedAppointment: Appointment = {
      id: appt.id,
      clientId: appt.clientId,
      date: dateIsoString,
      durationMinutes,
      status: appt.status,
      paymentStatus: appt.paymentStatus,
      notes,
      createdAt: appt.createdAt,
      updatedAt: new Date().toISOString(),
      isDeleted: false,
    };

    await this.appointmentRepo.update(updatedAppointment, serviceIds);

    // Cancel old reminder and schedule new one
    await this.notificationService.cancelNotificationAsync(id);
    const client = await this.clientRepo.findById(appt.clientId);
    if (client) {
      await this.scheduleReminder(updatedAppointment, client.name);
    }
  }

  async getClientMetrics(clientId: string) {
    if (!clientId)
      throw new Error("Client ID es requerido para obtener métricas");
    return await this.appointmentRepo.getClientMetrics(clientId);
  }
}
