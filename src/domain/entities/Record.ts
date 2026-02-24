export interface Record {
    id: string;
    title: string;
    subtitle?: string;
    metadata?: string;
    type: string;
    userId?: string;
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
}