import { getErrorMessage } from "@/src/application/errors/getErrorMessage";
import { ClientService } from "@/src/application/services/ClientService";
import { generateId } from "@/src/application/utils/id";
import { Client } from "@/src/domain/entities/Client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutAnimation } from "react-native";

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

  const remove = useCallback(
    async (id: string) => {
      try {
        await service.delete(id);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        await load();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [service, load],
  );

  const update = useCallback(
    async (client: Client) => {
      try {
        await service.update(client);
        await load();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [service, load],
  );

  const create = useCallback(
    async (name: string, phone: string, notes?: string) => {
      try {
        const now = new Date().toISOString();
        const newClient: Client = {
          id: generateId(),
          name: name.trim(),
          phone: phone.trim() || "Sin teléfono",
          notes: notes?.trim() || undefined,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };
        await service.create(newClient);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        await load();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [service, load],
  );

  return {
    clients,
    loading,
    load,
    remove,
    update,
    create,
  };
}
