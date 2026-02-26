import { getErrorMessage } from "@/src/application/errors/getErrorMessage";
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
        try {
            await service.create(title, type);
            await load();
        } catch (error) {
            throw new Error(getErrorMessage(error));
        };
    };

    const update = async (record: Record) => {
        try {
            await service.update(record);
            await load();
        } catch (error) {
            throw new Error(getErrorMessage(error));
        };
    };

    const remove = async (id: string) => {
        try {
            await service.delete(id);
            await load();
        } catch (error) {
            throw new Error(getErrorMessage(error));
        };
    };

    const existsByTitle = async (title: string) => {
        return await service.existsByTitle(title);
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
        existsByTitle,
    };
}