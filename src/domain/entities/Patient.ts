export interface Patient {
    id: string;
    name: string;
    email?: string;
    phone: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
}