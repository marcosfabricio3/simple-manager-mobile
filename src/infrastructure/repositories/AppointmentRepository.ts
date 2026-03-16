import { generateId } from "../../application/utils/id";
import {
    Appointment,
    AppointmentWithDetails,
} from "../../domain/entities/Appointment";
import { db } from "../database/database";

interface ServiceJsonRow {
  id: string;
  name: string;
  color: string;
  price: number;
}

interface AppointmentJoinedRow {
  id: string;
  clientId: string;
  date: string;
  durationMinutes: number;
  status: "pending" | "completed" | "cancelled";
  paymentStatus: "paid" | "unpaid";
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: number;
  clientName: string;
  clientPhone?: string;
  servicesJson: string; // From JSON_GROUP_ARRAY
  serviceId?: string;
  serviceName?: string;
  serviceDefaultPrice?: number;
  serviceColor?: string;
}

export class AppointmentRepository {
  async create(appointment: Appointment, serviceIds: (string | { serviceId: string, price: number | null })[]): Promise<void> {
    await db.withTransactionAsync(async () => {
      // 1. Insert Appointment
      await db.runAsync(
        `INSERT INTO appointments (
            id, clientId, date, durationMinutes, status, paymentStatus, notes, createdAt, updatedAt, isDeleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appointment.id,
          appointment.clientId,
          appointment.date,
          appointment.durationMinutes,
          appointment.status,
          appointment.paymentStatus,
          appointment.notes || null,
          appointment.createdAt,
          appointment.updatedAt,
          appointment.isDeleted ? 1 : 0,
        ],
      );

      // 2. Insert into pivot table `appointment_services`
      // We need custom UUIDs for the pivot. Expo Crypto shouldn't be here ideally,
      // but to keep it simple, we generate them via SQL or pass them from the Service layer.
      // We will pass them dynamically to keep Repositories clean of logic.

      // As we didn't inject IDs for the pivot from the domain for simplicity,
      // we can rely on SQLite's random hex function or simply JS generation
      for (const svc of serviceIds) {
        const pivotId = generateId();
        const sId = typeof svc === "string" ? svc : svc.serviceId;
        const sPrice = typeof svc === "string" ? null : svc.price;

        await db.runAsync(
          `INSERT INTO appointment_services (
              id, appointmentId, serviceId, customPrice, createdAt
          ) VALUES (?, ?, ?, ?, ?)`,
          [
            pivotId,
            appointment.id,
            sId,
            sPrice,
            new Date().toISOString(),
          ],
        );
      }
    });
  }

  async findUpcoming(): Promise<AppointmentWithDetails[]> {
    const rows = await db.getAllAsync<AppointmentJoinedRow>(`
        SELECT 
            a.*,
            c.name as clientName,
            c.phone as clientPhone,
            IFNULL(
                (
                    SELECT json_group_array(
                        json_object(
                            'id', s.id,
                            'name', s.name,
                            'color', s.color,
                            'price', COALESCE(asPivot.customPrice, s.defaultPrice)
                        )
                    )
                    FROM appointment_services asPivot
                    JOIN services s ON asPivot.serviceId = s.id
                    WHERE asPivot.appointmentId = a.id
                ), '[]'
            ) as servicesJson
        FROM appointments a
        JOIN clients c ON a.clientId = c.id
        WHERE a.isDeleted = 0 
          AND a.date >= date('now', 'localtime')
        ORDER BY a.date ASC
    `);

    return rows.map((r): AppointmentWithDetails => {
      const services: ServiceJsonRow[] = JSON.parse(r.servicesJson);
      const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

      return {
        id: r.id,
        clientId: r.clientId,
        date: r.date,
        durationMinutes: r.durationMinutes,
        status: r.status,
        paymentStatus: r.paymentStatus || "unpaid",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        isDeleted: Boolean(r.isDeleted),
        notes: r.notes,
        clientName: r.clientName,
        clientPhone: r.clientPhone,
        services,
        totalPrice,
      };
    });
  }

  async softDelete(id: string) {
    await db.runAsync(`UPDATE appointments SET isDeleted = 1 WHERE id = ?`, [
      id,
    ]);
  }

  async findBetweenDates(
    startDateIso: string,
    endDateIso: string,
  ): Promise<AppointmentWithDetails[]> {
    const rows = await db.getAllAsync<AppointmentJoinedRow>(
      `
        SELECT 
            a.*,
            c.name as clientName,
            c.phone as clientPhone,
            IFNULL(
                (
                    SELECT json_group_array(
                        json_object(
                            'id', s.id,
                            'name', s.name,
                            'color', s.color,
                            'price', COALESCE(asPivot.customPrice, s.defaultPrice)
                        )
                    )
                    FROM appointment_services asPivot
                    JOIN services s ON asPivot.serviceId = s.id
                    WHERE asPivot.appointmentId = a.id
                ), '[]'
            ) as servicesJson
        FROM appointments a
        JOIN clients c ON a.clientId = c.id
        WHERE a.isDeleted = 0 
          AND a.date >= ? 
          AND a.date < ?
        ORDER BY a.date ASC
    `,
      [startDateIso, endDateIso],
    );

    return rows.map((r): AppointmentWithDetails => {
      const services: ServiceJsonRow[] = JSON.parse(r.servicesJson);
      const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

      return {
        id: r.id,
        clientId: r.clientId,
        date: r.date,
        durationMinutes: r.durationMinutes,
        status: r.status,
        paymentStatus: r.paymentStatus || "unpaid",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        isDeleted: Boolean(r.isDeleted),
        notes: r.notes,
        clientName: r.clientName,
        clientPhone: r.clientPhone,
        services,
        totalPrice,
      };
    });
  }

  async findToday(): Promise<AppointmentWithDetails[]> {
    // Uses date() function in SQLite to match local ISO string slices
    const rows = await db.getAllAsync<AppointmentJoinedRow>(`
        SELECT 
            a.*,
            c.name as clientName,
            c.phone as clientPhone,
            IFNULL(
                (
                    SELECT json_group_array(
                        json_object(
                            'id', s.id,
                            'name', s.name,
                            'color', s.color,
                            'price', COALESCE(asPivot.customPrice, s.defaultPrice)
                        )
                    )
                    FROM appointment_services asPivot
                    JOIN services s ON asPivot.serviceId = s.id
                    WHERE asPivot.appointmentId = a.id
                ), '[]'
            ) as servicesJson
        FROM appointments a
        JOIN clients c ON a.clientId = c.id
        WHERE a.isDeleted = 0 
          AND date(a.date) = date('now', 'localtime')
        ORDER BY a.date ASC
    `);

    return rows.map((r): AppointmentWithDetails => {
      const services: ServiceJsonRow[] = JSON.parse(r.servicesJson);
      const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

      return {
        id: r.id,
        clientId: r.clientId,
        date: r.date,
        durationMinutes: r.durationMinutes,
        status: r.status,
        paymentStatus: r.paymentStatus || "unpaid",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        isDeleted: Boolean(r.isDeleted),
        notes: r.notes,
        clientName: r.clientName,
        clientPhone: r.clientPhone,
        services,
        totalPrice,
      };
    });
  }

  async calculateRevenueToday(): Promise<number> {
    const todayAppointments = await this.findToday();
    // Sum all appointment totals
    return todayAppointments.reduce((sum, appt) => sum + appt.totalPrice, 0);
  }

  async getClientMetrics(clientId: string) {
    const rows = await db.getAllAsync<AppointmentJoinedRow>(
      `
        SELECT 
            a.*,
            c.name as clientName,
            c.phone as clientPhone,
            IFNULL(
                (
                    SELECT json_group_array(
                        json_object(
                            'id', s.id,
                            'name', s.name,
                            'color', s.color,
                            'price', COALESCE(asPivot.customPrice, s.defaultPrice)
                        )
                    )
                    FROM appointment_services asPivot
                    JOIN services s ON asPivot.serviceId = s.id
                    WHERE asPivot.appointmentId = a.id
                ), '[]'
            ) as servicesJson
        FROM appointments a
        JOIN clients c ON a.clientId = c.id
        WHERE a.isDeleted = 0 
          AND a.clientId = ?
        ORDER BY a.date DESC
    `,
      [clientId],
    );

    const history = rows.map((r): AppointmentWithDetails => {
      const services: ServiceJsonRow[] = JSON.parse(r.servicesJson);
      const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

      return {
        id: r.id,
        clientId: r.clientId,
        date: r.date,
        durationMinutes: r.durationMinutes,
        status: r.status,
        paymentStatus: r.paymentStatus || "unpaid",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        isDeleted: Boolean(r.isDeleted),
        notes: r.notes,
        clientName: r.clientName,
        clientPhone: r.clientPhone,
        services,
        totalPrice,
      };
    });

    const totalAppointments = history.length;
    const cancelledAppointments = history.filter(
      (h) => h.status === "cancelled",
    ).length;

    // Calculate debt only from active appointments (completed or pending) that remain unpaid
    const debtAppointments = history.filter(
      (h) => h.status !== "cancelled" && h.paymentStatus === "unpaid",
    );
    const totalDebt = debtAppointments.reduce(
      (sum, appt) => sum + appt.totalPrice,
      0,
    );

    // Calculate total spent from all active appointments that are paid
    const paidAppointments = history.filter(
      (h) => h.status !== "cancelled" && h.paymentStatus === "paid",
    );
    const totalSpent = paidAppointments.reduce(
      (sum, appt) => sum + appt.totalPrice,
      0,
    );

    // Find the next closest pending appointment, but ONLY if the date is in the future
    const nowISO = new Date().toISOString();
    const pendingAppointments = history.filter(
      (h) => h.status === "pending" && h.date > nowISO,
    );
    // since history is ordered DESC, pending closest to now would correspond to last or manual sort
    pendingAppointments.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const nextPending =
      pendingAppointments.length > 0 ? pendingAppointments[0].date : null;

    return {
      history,
      totalAppointments,
      cancelledAppointments,
      totalDebt,
      totalSpent,
      nextPending,
    };
  }

  async findById(id: string): Promise<AppointmentWithDetails | null> {
    const rawData = await db.getAllAsync<AppointmentJoinedRow>(
      `SELECT 
        a.*,
        c.name as clientName,
        c.phone as clientPhone,
        s.id as serviceId,
        s.name as serviceName,
        COALESCE(pivot.customPrice, s.defaultPrice) as serviceDefaultPrice,
        s.color as serviceColor
       FROM appointments a
       JOIN clients c ON a.clientId = c.id
       LEFT JOIN appointment_services pivot ON a.id = pivot.appointmentId
       LEFT JOIN services s ON pivot.serviceId = s.id
       WHERE a.id = ? AND a.isDeleted = 0`,
      [id],
    );

    if (rawData.length === 0) return null;

    const grouped = new Map<string, AppointmentWithDetails>();
    for (const row of rawData) {
      if (!grouped.has(row.id)) {
        grouped.set(row.id, {
          id: row.id,
          clientId: row.clientId,
          date: row.date,
          durationMinutes: row.durationMinutes,
          status: row.status,
          paymentStatus: row.paymentStatus,
          notes: row.notes,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          isDeleted: row.isDeleted === 1,
          clientName: row.clientName,
          clientPhone: row.clientPhone,
          services: [],
          totalPrice: 0,
        });
      }

      if (row.serviceId && row.serviceName) {
        grouped.get(row.id)!.services.push({
          id: row.serviceId,
          name: row.serviceName,
          price: row.serviceDefaultPrice || 0,
          color: row.serviceColor || "#000",
        });
        grouped.get(row.id)!.totalPrice += row.serviceDefaultPrice || 0;
      }
    }

    return Array.from(grouped.values())[0];
  }

  async updatePaymentStatus(id: string, paymentStatus: "paid" | "unpaid") {
    await db.runAsync(
      `UPDATE appointments SET paymentStatus = ? WHERE id = ?`,
      [paymentStatus, id],
    );
  }

  async updateStatus(
    id: string,
    status: "pending" | "completed" | "cancelled",
  ) {
    await db.runAsync(`UPDATE appointments SET status = ? WHERE id = ?`, [
      status,
      id,
    ]);
  }

  async update(appointment: Appointment, serviceIds: (string | { serviceId: string, price: number | null })[]): Promise<void> {
    await db.withTransactionAsync(async () => {
      // 1. Update Appointment
      await db.runAsync(
        `UPDATE appointments 
         SET clientId = ?, date = ?, durationMinutes = ?, status = ?, paymentStatus = ?, notes = ?, updatedAt = ?, isDeleted = ?
         WHERE id = ?`,
        [
          appointment.clientId,
          appointment.date,
          appointment.durationMinutes,
          appointment.status,
          appointment.paymentStatus,
          appointment.notes || null,
          appointment.updatedAt,
          appointment.isDeleted ? 1 : 0,
          appointment.id,
        ],
      );

      // 2. Delete old pivot rows
      await db.runAsync(
        `DELETE FROM appointment_services WHERE appointmentId = ?`,
        [appointment.id],
      );

      // 3. Insert new pivot rows
      for (const svc of serviceIds) {
        const pivotId = generateId();
        const sId = typeof svc === "string" ? svc : svc.serviceId;
        const sPrice = typeof svc === "string" ? null : svc.price;

        await db.runAsync(
          `INSERT INTO appointment_services (id, appointmentId, serviceId, customPrice, createdAt) VALUES (?, ?, ?, ?, ?)`,
          [pivotId, appointment.id, sId, sPrice, new Date().toISOString()],
        );
      }
    });
  }
}
