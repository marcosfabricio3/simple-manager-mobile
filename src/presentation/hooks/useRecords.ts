import { getErrorMessage } from "@/src/application/errors/getErrorMessage";
import { RecordService } from "@/src/application/services/RecordService";
import { Record } from "@/src/domain/entities/Record";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutAnimation } from "react-native";

export function useRecords() {
  const service = useMemo(() => new RecordService(), []);
  const [records, setRecords] = useState<Record[]>([]);

  const load = useCallback(async () => {
    const data = await service.list();
    setRecords(data);
  }, [service]);

  const create = useCallback(
    async (title: string, type: string) => {
      try {
        await service.create(title, type);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        await load();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [service, load],
  );

  const update = useCallback(
    async (record: Record) => {
      try {
        await service.update(record);
        await load();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    [service, load],
  );

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

  const existsByTitle = useCallback(
    async (title: string) => {
      return await service.existsByTitle(title);
    },
    [service],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    records,
    load,
    create,
    update,
    remove,
    existsByTitle,
  };
}
