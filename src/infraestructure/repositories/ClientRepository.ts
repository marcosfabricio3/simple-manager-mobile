import { Client } from "../../domain/entities/Client";
import { db } from "../database/database";

export class ClientRepository {
  async create(client: Client): Promise<void> {
    await db.runAsync(
      `
            INSERT INTO clients (
            id, name, phone, email, notes, createdAt, updatedAt, isDeleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client.id,
        client.name,
        client.phone,
        client.email || null,
        client.notes || null,
        client.createdAt,
        client.updatedAt,
        client.isDeleted ? 1 : 0,
      ],
    );
  }

  async findAll(): Promise<Client[]> {
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM clients WHERE isDeleted = 0 ORDER BY name ASC`,
    );

    return rows.map((r) => ({
      ...r,
      isDeleted: Boolean(r.isDeleted),
    }));
  }

  async findById(id: string): Promise<Client | null> {
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM clients WHERE id = ? AND isDeleted = 0`,
      [id],
    );

    if (!row) return null;

    return {
      ...row,
      isDeleted: Boolean(row.isDeleted),
    };
  }

  async countTotal(): Promise<number> {
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM clients WHERE isDeleted = 0`,
    );
    return row?.count || 0;
  }
}
