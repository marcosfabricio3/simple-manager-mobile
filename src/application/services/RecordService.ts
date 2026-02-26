import { Record } from "@/src/domain/entities/Record";
import { RecordRepository } from "@/src/infraestructure/repositories/RecordRepository";
import * as Crypto from 'expo-crypto';

export class RecordService {
    private repository = new RecordRepository();

    async create(title: string, type: string) {

        const now = new Date().toISOString();

        const record: Record = {
            id: Crypto.randomUUID(),
            title,
            type,
            createdAt: now,
            updatedAt: now,
            isDeleted: false,
        }

        await this.repository.create(record);

        return record;
    }

    async list() {
        return await this.repository.findAll();
    }

    async delete(id: string) {
        await this.repository.softDelete(id);
    }

    async update(record: Record) {
        record.updatedAt = new Date().toISOString();
        await this.repository.update(record);
    }

    async existsByTitle(title: string): Promise<boolean> {
        const records = await this.repository.findAll();
        return records.some(r => r.title.toLowerCase() === title.toLowerCase());
    }

}
