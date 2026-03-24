import { encryptionService } from "../../application/services/EncryptionService";
import { Client } from "../../domain/entities/Client";
import { db } from "../database/database";

export class ClientRepository {
  async create(client: Client): Promise<void> {
    const encryptedClient = {
      ...client,
      name: await encryptionService.encrypt(client.name),
      phone: await encryptionService.encrypt(client.phone),
      email: client.email
        ? await encryptionService.encrypt(client.email)
        : null,
      notes: client.notes
        ? await encryptionService.encrypt(client.notes)
        : null,
    };

    await db.runAsync(
      `
            INSERT INTO clients (
            id, name, phone, email, notes, createdAt, updatedAt, isDeleted, isNew)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        encryptedClient.id,
        encryptedClient.name,
        encryptedClient.phone,
        encryptedClient.email,
        encryptedClient.notes,
        encryptedClient.createdAt,
        encryptedClient.updatedAt,
        encryptedClient.isDeleted ? 1 : 0,
        encryptedClient.isNew ? 1 : 0,
      ],
    );
  }

  async findAll(): Promise<Client[]> {
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM clients WHERE isDeleted = 0 ORDER BY name ASC`,
    );

    return Promise.all(
      rows.map(async (r) => ({
        ...r,
        name: await encryptionService.decrypt(r.name),
        phone: await encryptionService.decrypt(r.phone),
        email: r.email ? await encryptionService.decrypt(r.email) : null,
        notes: r.notes ? await encryptionService.decrypt(r.notes) : null,
        isDeleted: Boolean(r.isDeleted),
        isNew: Boolean(r.isNew),
      })),
    );
  }

  async findById(id: string): Promise<Client | null> {
    const row = await db.getFirstAsync<any>(
      `SELECT * FROM clients WHERE id = ? AND isDeleted = 0`,
      [id],
    );

    if (!row) return null;

    return {
      ...row,
      name: await encryptionService.decrypt(row.name),
      phone: await encryptionService.decrypt(row.phone),
      email: row.email ? await encryptionService.decrypt(row.email) : null,
      notes: row.notes ? await encryptionService.decrypt(row.notes) : null,
      isDeleted: Boolean(row.isDeleted),
      isNew: Boolean(row.isNew),
    };
  }

  async countTotal(): Promise<number> {
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM clients WHERE isDeleted = 0`,
    );
    return row?.count || 0;
  }

  async update(client: Client): Promise<void> {
    const encryptedName = await encryptionService.encrypt(client.name);
    const encryptedPhone = await encryptionService.encrypt(client.phone);
    const encryptedNotes = client.notes
      ? await encryptionService.encrypt(client.notes)
      : null;

    await db.runAsync(
      `UPDATE clients SET name = ?, phone = ?, notes = ?, updatedAt = ?, isNew = ? WHERE id = ?`,
      [
        encryptedName,
        encryptedPhone,
        encryptedNotes,
        client.updatedAt,
        client.isNew ? 1 : 0,
        client.id,
      ],
    );
  }

  async softDelete(id: string): Promise<void> {
    await db.runAsync(`UPDATE clients SET isDeleted = 1 WHERE id = ?`, [id]);
  }
}
