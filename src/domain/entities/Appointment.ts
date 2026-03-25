export type AppointmentStatus = "pending" | "cancelled" | "completed";
export type PaymentStatus = "paid" | "unpaid";
export type RecurrenceType = "none" | "weekly" | "biweekly" | "monthly";
export type PaymentMethod = "cash" | "debit_credit" | "mercado_pago" | "transfer" | "other";

export interface Appointment {
  id: string;
  clientId: string; // Updated from patientId to clientId
  date: string;
  durationMinutes: number;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentMethodDetails?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  notes?: string;
  seriesId: string;
  recurrence: RecurrenceType;
}

// Extends the base Appointment for the UI to display the joined data cleanly
export interface AppointmentWithDetails extends Appointment {
  clientName: string;
  clientPhone?: string;
  clientIsNew: boolean;
  services: {
    id: string; // Service ID
    name: string;
    color: string;
    price: number; // This will be the absolute price (custom or default)
  }[];
  totalPrice: number;
}
