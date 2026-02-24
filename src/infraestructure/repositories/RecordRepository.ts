import { Record } from "../../domain/entities/Record";
import { db } from "../database/database";

export class RecordRepository {

    async create(record: Record) {
        await db.runAsync(`
            INSERT INTO records (
            id, title, subtitle, metadata, type, userId, createdAt, updatedAt, isDeleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                record.id,
                record.title,
                record.subtitle ?? null,
                record.metadata ?? null,
                record.type,
                record.userId ?? null,
                record.createdAt,
                record.updatedAt,
                record.isDeleted ? 1 : 0,
            ]
        )
    }

    // async findAll(): Promise<Record[]> {
    //     return await db.getAllAsync<Record>(`SELECT * FROM records WHERE isDeleted = 0`)
    // };

    async findAll(): Promise<Record[]> {
        const rows = await db.getAllAsync<any>(
            `SELECT * FROM records WHERE isDeleted = 0`
        );

        return rows.map(r => ({
            ...r,
            isDeleted: Boolean(r.isDeleted),
        }));
    };

    async softDelete(id: string) {
        await db.runAsync(
            `UPDATE records SET isDeleted = 1 WHERE id = ?`,
            [id]
        );
    }
}