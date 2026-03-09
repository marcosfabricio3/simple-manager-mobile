import { Client } from "@/src/domain/entities/Client";
import { ClientRepository } from "@/src/infraestructure/repositories/ClientRepository";

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
}
