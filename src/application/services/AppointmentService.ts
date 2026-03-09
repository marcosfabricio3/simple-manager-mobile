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
      notes: notes?.trim() || "",
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    // 3. Persist atomically
    await this.appointmentRepo.create(appointment, serviceIds);
  }

  async listUpcoming() {
    return await this.appointmentRepo.findUpcoming();
  }

  async listToday() {
    return await this.appointmentRepo.findToday();
  }

  async getRevenueToday(): Promise<number> {
    return await this.appointmentRepo.calculateRevenueToday();
  }

  async delete(id: string) {
    await this.appointmentRepo.softDelete(id);
  }
}
