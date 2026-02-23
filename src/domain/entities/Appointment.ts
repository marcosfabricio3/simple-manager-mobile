export type AppointmentStatus = "pending" | "cancelled" | "completed";

export interface Appointment {
    id: string;
    patientId: string;
    date: string;
    durationMinutes: number;
    status: AppointmentStatus;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
    notes?: string;
}
