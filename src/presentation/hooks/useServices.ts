import { getErrorMessage } from "@/src/application/errors/getErrorMessage";
import { ServiceService } from "@/src/application/services/ServiceService";
import { Service } from "@/src/domain/entities/Service";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutAnimation } from "react-native";

export function useServices() {
  const serviceManager = useMemo(() => new ServiceService(), []);
  const [services, setServices] = useState<Service[]>([]);

  const load = useCallback(async () => {
    const data = await serviceManager.list();
    setServices(data);
  }, [serviceManager]);

  const create = useCallback(
    async (name: string, defaultPrice: number, color: string) => {
      try {
        await serviceManager.create(name, defaultPrice, color);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        await load();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [serviceManager, load],
  );

  const update = useCallback(
    async (service: Service) => {
      try {
        await serviceManager.update(service);
        await load();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [serviceManager, load],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await serviceManager.delete(id);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        await load();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [serviceManager, load],
  );

  const existsByName = useCallback(
    async (name: string) => {
      return await serviceManager.existsByName(name);
    },
    [serviceManager],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    services,
    load,
    create,
    update,
    remove,
    existsByName,
  };
}
