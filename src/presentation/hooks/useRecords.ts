import { RecordService } from "@/src/application/services/RecordService";
import { Record } from "@/src/domain/entities/Record";
import { useEffect, useMemo, useState } from "react";

export function useRecords() {
    const service = useMemo(() => new RecordService(), []);
    const [records, setRecords] = useState<Record[]>([]);

    const load = async () => {
        const data = await service.list();
        setRecords(data);
    };

    const create = async (title: string, type: string) => {
        await service.create(title, type);
        await load();
    };

    const update = async (record: Record) => {
        await service.update(record);
        await load();
    };

    const remove = async (id: string) => {
        await service.delete(id);
        await load();
    };

    useEffect(() => {
        load();
    }, []);

    return {
        records,
        load,
        create,
        update,
        remove,
    };
}