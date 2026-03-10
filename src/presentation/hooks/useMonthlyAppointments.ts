import { AppointmentService } from "@/src/application/services/AppointmentService";
import { AppointmentWithDetails } from "@/src/domain/entities/Appointment";
import { useCallback, useMemo, useRef, useState } from "react";

export function useMonthlyAppointments() {
  const serviceManager = useMemo(() => new AppointmentService(), []);
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const lastLoadedRef = useRef({ year: 0, month: 0 });

  const loadMonth = useCallback(
    async (year: number, month: number, force = false) => {
      // Avoid re-fetching if we already have this month in state unless forced
      if (
        !force &&
        lastLoadedRef.current.year === year &&
        lastLoadedRef.current.month === month
      ) {
        return;
      }

      try {
        setLoading(true);
        // Construct start and end dates for the month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 1); // First day of next month

        const data = await serviceManager.listBetweenDates(
          startDate.toISOString(),
          endDate.toISOString(),
        );

        lastLoadedRef.current = { year, month };
        setAppointments(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [serviceManager],
  );

  return {
    appointments,
    loading,
    loadMonth,
  };
}
