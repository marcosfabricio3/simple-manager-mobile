import { getErrorMessage } from "@/src/application/errors/getErrorMessage";
import { ServiceService } from "@/src/application/services/ServiceService";
import { Service } from "@/src/domain/entities/Service";
import { useEffect, useMemo, useState } from "react";

export function useServices() {
  const serviceManager = useMemo(() => new ServiceService(), []);
  const [services, setServices] = useState<Service[]>([]);

  const load = async () => {
    const data = await serviceManager.list();
    setServices(data);
  };

  const create = async (name: string, defaultPrice: number, color: string) => {
    try {
      await serviceManager.create(name, defaultPrice, color);
      await load();
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const update = async (service: Service) => {
    try {
      await serviceManager.update(service);
      await load();
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const remove = async (id: string) => {
    try {
      await serviceManager.delete(id);
      await load();
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const existsByName = async (name: string) => {
    return await serviceManager.existsByName(name);
  };

  useEffect(() => {
    load();
  }, []);

  return {
    services,
    load,
    create,
    update,
    remove,
    existsByName,
  };
}
