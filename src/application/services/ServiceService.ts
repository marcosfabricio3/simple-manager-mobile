import { Service } from "@/src/domain/entities/Service";
import { ServiceRepository } from "@/src/infrastructure/repositories/ServiceRepository";
import { generateId } from "../utils/id";

export class ServiceService {
  private repository = new ServiceRepository();

  async create(name: string, defaultPrice: number, color: string) {
    if (!name.trim()) throw new Error("El nombre no puede estar vacío");
    if (defaultPrice < 0) throw new Error("El precio no puede ser negativo");

    const now = new Date().toISOString();

    const service: Service = {
      id: generateId(),
      name: name.trim(),
      defaultPrice,
      color: color.trim() || "#007AFF", // default blue
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.repository.create(service);
    return service;
  }

  async list() {
    return await this.repository.findAll();
  }

  async delete(id: string) {
    await this.repository.softDelete(id);
  }

  async update(service: Service) {
    if (!service.name.trim()) throw new Error("El nombre no puede estar vacío");
    if (service.defaultPrice < 0)
      throw new Error("El precio no puede ser negativo");

    service.name = service.name.trim();
    service.color = service.color.trim() || "#007AFF";
    service.updatedAt = new Date().toISOString();

    await this.repository.update(service);
  }

  async existsByName(name: string): Promise<boolean> {
    const services = await this.repository.findAll();
    return services.some(
      (s) => s.name.toLowerCase() === name.trim().toLowerCase(),
    );
  }
}
