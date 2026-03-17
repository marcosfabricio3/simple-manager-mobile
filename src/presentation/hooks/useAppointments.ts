import { getErrorMessage } from "@/src/application/errors/getErrorMessage";
import { AppointmentService, SelectedService } from "@/src/application/services/AppointmentService";
import { AppointmentWithDetails, RecurrenceType } from "@/src/domain/entities/Appointment";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useAppointments() {
  const serviceManager = useMemo(() => new AppointmentService(), []);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await serviceManager.listUpcoming();
      setAppointments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [serviceManager]);

  const createWithExisting = async (
    clientId: string,
    dateIsoString: string,
    durationMinutes: number,
    serviceIds: SelectedService[],
    recurrence: RecurrenceType = "none",
    notes?: string,
  ) => {
    try {
      await serviceManager.createWithExistingClient(
        clientId,
        dateIsoString,
        durationMinutes,
        serviceIds,
        recurrence,
        notes,
      );
      await load();
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const createNewClientAndAppt = async (
    clientName: string,
    clientPhone: string,
    dateIsoString: string,
    durationMinutes: number,
    serviceIds: SelectedService[],
    recurrence: RecurrenceType = "none",
    notes?: string,
  ) => {
    try {
      await serviceManager.createWithClient(
        clientName,
        clientPhone,
        dateIsoString,
        durationMinutes,
        serviceIds,
        recurrence,
        notes,
      );
      await load();
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  return {
    appointments,
    loading,
    load,
    createWithExisting,
    createNewClientAndAppt,
    remove: async (id: string) => {
      try {
        await serviceManager.delete(id);
        await load();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    removeSeries: async (id: string, mode: "single" | "future" | "all") => {
      try {
        await serviceManager.deleteSeries(id, mode);
        await load();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    updateSeries: async (id: string, mode: "single" | "future" | "all", data: any) => {
      try {
        await serviceManager.updateSeries(id, mode, data);
        await load();
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    }
  };
}
