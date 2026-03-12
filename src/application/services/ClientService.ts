import { Client } from "@/src/domain/entities/Client";
import { ClientRepository } from "@/src/infrastructure/repositories/ClientRepository";

export class ClientService {
  private repository = new ClientRepository();

  async getCountTotal(): Promise<number> {
    return await this.repository.countTotal();
  }

  async create(client: Client): Promise<void> {
    await this.repository.create(client);
  }

  async listAll() {
    return await this.repository.findAll();
  }

  async update(client: Client): Promise<void> {
    client.updatedAt = new Date().toISOString();
    await this.repository.update(client);
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
