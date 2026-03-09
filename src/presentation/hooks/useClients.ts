import { ClientService } from "@/src/application/services/ClientService";
import { Client } from "@/src/domain/entities/Client";
import { useCallback, useEffect, useMemo, useState } from "react";

// Inline helper or import
function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function useClients() {
  const service = useMemo(() => new ClientService(), []);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await service.listAll();
      setClients(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: string) => {
    try {
      await service.delete(id);
      await load();
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const update = async (client: Client) => {
    try {
      await service.update(client);
      await load();
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const create = async (name: string, phone: string, notes?: string) => {
    try {
      const now = new Date().toISOString();
      const newClient: Client = {
        id: Math.random().toString(36).substring(2, 15), // Ideally Crypto UUID
        name: name.trim(),
        phone: phone.trim() || "Sin teléfono",
        notes: notes?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      };
      await service.create(newClient);
      await load();
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  return {
    clients,
    loading,
    load,
    remove,
    update,
    create,
  };
}
