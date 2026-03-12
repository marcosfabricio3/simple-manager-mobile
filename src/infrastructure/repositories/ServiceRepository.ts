import { Service } from "../../domain/entities/Service";
import { db } from "../database/database";

export class ServiceRepository {
  async create(service: Service) {
    await db.runAsync(
      `
            INSERT INTO services (
            id, name, defaultPrice, color, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        service.id,
        service.name,
        service.defaultPrice,
        service.color,
        service.isActive ? 1 : 0,
        service.createdAt,
        service.updatedAt,
      ],
    );
  }

  async findAll(): Promise<Service[]> {
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM services WHERE isActive = 1`,
    );

    return rows.map((r) => ({
      ...r,
      isActive: Boolean(r.isActive),
    }));
  }

  async softDelete(id: string) {
    await db.runAsync(`UPDATE services SET isActive = 0 WHERE id = ?`, [id]);
  }

  async update(service: Service) {
    await db.runAsync(
      `
            UPDATE services SET
                name = ?,
                defaultPrice = ?,
                color = ?,
                isActive = ?,
                updatedAt = ?
            WHERE id = ?
            `,
      [
        service.name,
        service.defaultPrice,
        service.color,
        service.isActive ? 1 : 0,
        service.updatedAt,
        service.id,
      ],
    );
  }
}
