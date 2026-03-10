import { Appointment } from "@/src/domain/entities/Appointment";
import { Client } from "@/src/domain/entities/Client";
import { AppointmentRepository } from "@/src/infraestructure/repositories/AppointmentRepository";
import { ClientRepository } from "@/src/infraestructure/repositories/ClientRepository";
import * as Crypto from "expo-crypto";

export class AppointmentService {
  private appointmentRepo = new AppointmentRepository();
  private clientRepo = new ClientRepository();

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
    // (In a fuller phase, we'd search if it exists first, but for MVP Phase 4
    // we just create a new client record to link the appointment to)
    const client: Client = {
      id: Crypto.randomUUID(),
      name: clientName.trim(),
      phone: clientPhone.trim() || "Sin teléfono",
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    await this.clientRepo.create(client);

    // 2. Handle Appointment
    const appointment: Appointment = {
      id: Crypto.randomUUID(),
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
      id: Math.random().toString(36).substring(2, 15), // fallback uuid
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
  }

  async getClientMetrics(clientId: string) {
    if (!clientId)
      throw new Error("Client ID es requerido para obtener métricas");
    return await this.appointmentRepo.getClientMetrics(clientId);
  }
}
