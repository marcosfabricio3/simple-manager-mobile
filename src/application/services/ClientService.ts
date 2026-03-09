import { ClientRepository } from "@/src/infraestructure/repositories/ClientRepository";

export class ClientService {
  private repository = new ClientRepository();

  async getCountTotal(): Promise<number> {
    return await this.repository.countTotal();
  }

  async listAll() {
    return await this.repository.findAll();
  }
}
