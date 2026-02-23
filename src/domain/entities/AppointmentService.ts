export interface AppointmentService {
    id: string;
    appointmentId: string;
    serviceId: string;
    customPrice?: number;
    createdAt: string;
}