export type AppointmentStatus = "pending" | "cancelled" | "completed";

export interface Appointment {
  id: string;
  clientId: string; // Updated from patientId to clientId
  date: string;
  durationMinutes: number;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  notes?: string;
}

// Extends the base Appointment for the UI to display the joined data cleanly
export interface AppointmentWithDetails extends Appointment {
  clientName: string;
  clientPhone?: string;
  services: {
    id: string;
    name: string;
    color: string;
    price: number;
  }[];
  totalPrice: number;
}
