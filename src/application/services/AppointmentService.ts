import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import {
  Appointment, RecurrenceType
} from "../../domain/entities/Appointment";
import { addWeeks, addMonths } from "date-fns";
import { Client } from "../../domain/entities/Client";
import { AppointmentRepository } from "../../infrastructure/repositories/AppointmentRepository";
import { ClientRepository } from "../../infrastructure/repositories/ClientRepository";
import { ExpoNotificationService } from "../../infrastructure/services/ExpoNotificationService";
import { generateId } from "../utils/id";

export type SelectedService = string | { serviceId: string; price: number | null };

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

  private async handleRecurrence(
    baseAppointment: Appointment,
    serviceIds: SelectedService[],
    recurrence: RecurrenceType
  ) {
    if (recurrence === "none") return;

    const startDate = new Date(baseAppointment.date);

    // Generate for 1 year ahead
    let maxCount = 0;
    if (recurrence === "weekly") maxCount = 52;
    else if (recurrence === "biweekly") maxCount = 26;
    else if (recurrence === "monthly") maxCount = 12;

    for (let i = 1; i < maxCount; i++) {
      let nextDate: Date;
      if (recurrence === "weekly") nextDate = addWeeks(startDate, i);
      else if (recurrence === "biweekly") nextDate = addWeeks(startDate, i * 2);
      else nextDate = addMonths(startDate, i);

      const instance: Appointment = {
        ...baseAppointment,
        id: generateId(),
        date: nextDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await this.appointmentRepo.create(instance, serviceIds);
      const client = await this.clientRepo.findById(baseAppointment.clientId);
      if (client) {
        await this.scheduleReminder(instance, client.name);
      }
    }
  }

  /**
   * Creates an appointment. Creates the client on the fly if it doesn't exist.
   */
  async createWithClient(
    clientName: string,
    clientPhone: string,
    dateIsoString: string,
    durationMinutes: number,
    serviceIds: SelectedService[],
    recurrence: RecurrenceType = "none",
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

    const seriesId = generateId();

    // 2. Handle Appointment
    const appointment: Appointment = {
      id: generateId(),
      clientId: client.id,
      date: dateIsoString,
      durationMinutes,
      status: "pending",
      paymentStatus: "unpaid",
      notes: notes?.trim() || "",
      seriesId,
      recurrence,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    // 3. Persist atomically
    await this.appointmentRepo.create(appointment, serviceIds);

    // 4. Handle Recurrence
    await this.handleRecurrence(appointment, serviceIds, recurrence);

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
    serviceIds: SelectedService[],
    recurrence: RecurrenceType = "none",
    notes?: string,
  ) {
    if (!clientId) throw new Error("Debes seleccionar un cliente válido.");
    if (!dateIsoString) throw new Error("Fecha del turno es requerida.");
    if (serviceIds.length === 0)
      throw new Error("Debes seleccionar al menos un servicio.");

    const now = new Date().toISOString();

    const seriesId = generateId();

    const appointment: Appointment = {
      id: generateId(),
      clientId: clientId, // Use the proper ID
      date: dateIsoString,
      durationMinutes,
      status: "pending",
      paymentStatus: "unpaid",
      notes: notes,
      seriesId,
      recurrence,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    await this.appointmentRepo.create(appointment, serviceIds);

    // Handle Recurrence
    await this.handleRecurrence(appointment, serviceIds, recurrence);

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
    serviceIds: SelectedService[],
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
      seriesId: appt.seriesId,
      recurrence: appt.recurrence,
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

  async deleteSeries(id: string, mode: "single" | "future" | "all") {
    const appt = await this.appointmentRepo.findById(id);
    if (!appt) return;

    if (mode === "single") {
      await this.delete(id);
    } else {
      const allUpcoming = await this.listUpcoming();
      const seriesInstances = allUpcoming.filter(a => a.seriesId === appt.seriesId);

      for (const instance of seriesInstances) {
        if (mode === "all" || (mode === "future" && instance.date >= appt.date)) {
          await this.delete(instance.id);
        }
      }
    }
  }

  async updateSeries(
    id: string,
    mode: "single" | "future" | "all",
    data: { dateIsoString: string, durationMinutes: number, serviceIds: SelectedService[], notes?: string }
  ) {
    const appt = await this.appointmentRepo.findById(id);
    if (!appt) return;

    if (mode === "single") {
      await this.update(id, data.dateIsoString, data.durationMinutes, data.serviceIds, data.notes);
    } else {
      const allUpcoming = await this.listUpcoming();
      const seriesInstances = allUpcoming.filter(a => a.seriesId === appt.seriesId);

      for (const instance of seriesInstances) {
        if (mode === "all" || (mode === "future" && instance.date >= appt.date)) {
          // Keep the same time of day but update the date based on instance's original date
          // For simplicity in this first version, we update all to the SAME data but preserving their relative dates
          // However, usually updating a series means updating the data (notes, services) but keeping the dates
          // If the user wants to change the TIME for all, they usually expect all future occurrences to shift too.
          // For now, we update services and notes for all.
          
          await this.update(instance.id, instance.date, data.durationMinutes, data.serviceIds, data.notes);
        }
      }
    }
  }
}
