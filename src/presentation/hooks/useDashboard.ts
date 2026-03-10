import { getErrorMessage } from "@/src/application/errors/getErrorMessage";
import { AppointmentService } from "@/src/application/services/AppointmentService";
import { ClientService } from "@/src/application/services/ClientService";
import { AppointmentWithDetails } from "@/src/domain/entities/Appointment";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useDashboard() {
  const apptService = useMemo(() => new AppointmentService(), []);
  const clientService = useMemo(() => new ClientService(), []);

  const [todayAppointments, setTodayAppointments] = useState<
    AppointmentWithDetails[]
  >([]);
  const [revenueToday, setRevenueToday] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [appts, rev, clientsCount] = await Promise.all([
        apptService.listToday(),
        apptService.getRevenueToday(),
        clientService.getCountTotal(),
      ]);

      setTodayAppointments(appts);
      setRevenueToday(rev);
      setTotalClients(clientsCount);
    } catch (error) {
      console.error("Error loading dashboard metrics:", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [apptService, clientService]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    todayAppointments,
    revenueToday,
    totalClients,
    loading,
    refresh: load,
  };
}
