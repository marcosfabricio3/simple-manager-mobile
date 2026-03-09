import { ClientService } from "@/src/application/services/ClientService";
import { Client } from "@/src/domain/entities/Client";
import { useCallback, useEffect, useMemo, useState } from "react";

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

  return {
    clients,
    loading,
    load,
  };
}
