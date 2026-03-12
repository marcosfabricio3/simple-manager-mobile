import { getErrorMessage } from "@/src/application/errors/getErrorMessage";
import { AppointmentService } from "@/src/application/services/AppointmentService";
import { ClientService } from "@/src/application/services/ClientService";
import { AppointmentWithDetails } from "@/src/domain/entities/Appointment";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface ServiceStat {
  name: string;
  count: number;
  percentage: number;
}

export interface MonthlyStats {
  // Revenue
  totalRevenue: number;
  paidRevenue: number;
  outstandingRevenue: number;
  // Appointment counts
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
  // Top services
  topServices: ServiceStat[];
  // Global
  totalClients: number;
}

const EMPTY_STATS: MonthlyStats = {
  totalRevenue: 0,
  paidRevenue: 0,
  outstandingRevenue: 0,
  total: 0,
  completed: 0,
  pending: 0,
  cancelled: 0,
  topServices: [],
  totalClients: 0,
};

export function useStatistics() {
  const apptService = useMemo(() => new AppointmentService(), []);
  const clientService = useMemo(() => new ClientService(), []);

  const [stats, setStats] = useState<MonthlyStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState<Date>(new Date());

  const load = useCallback(
    async (targetMonth: Date) => {
      try {
        setLoading(true);

        const start = new Date(
          targetMonth.getFullYear(),
          targetMonth.getMonth(),
          1,
        );
        const end = new Date(
          targetMonth.getFullYear(),
          targetMonth.getMonth() + 1,
          0,
          23,
          59,
          59,
        );

        const [appointments, totalClients] = await Promise.all([
          apptService.listBetweenDates(
            start.toISOString(),
            end.toISOString(),
          ) as Promise<AppointmentWithDetails[]>,
          clientService.getCountTotal(),
        ]);

        // Status counts
        const completed = appointments.filter(
          (a) => a.status === "completed",
        ).length;
        const pending = appointments.filter(
          (a) => a.status === "pending",
        ).length;
        const cancelled = appointments.filter(
          (a) => a.status === "cancelled",
        ).length;

        // Revenue — only from paid+completed appointments
        let paidRevenue = 0;
        let outstandingRevenue = 0;

        for (const appt of appointments) {
          if (appt.status === "cancelled") continue;
          const apptTotal = (appt.services ?? []).reduce(
            (sum: number, s: { price?: number }) => sum + (s.price ?? 0),
            0,
          );
          if (appt.paymentStatus === "paid") {
            paidRevenue += apptTotal;
          } else {
            outstandingRevenue += apptTotal;
          }
        }

        // Service frequency map
        const serviceMap = new Map<string, number>();
        for (const appt of appointments) {
          if (appt.status === "cancelled") continue;
          for (const svc of appt.services ?? []) {
            const key = svc.name ?? "Unknown";
            serviceMap.set(key, (serviceMap.get(key) ?? 0) + 1);
          }
        }

        const totalServiceBookings = Array.from(serviceMap.values()).reduce(
          (a, b) => a + b,
          0,
        );

        const topServices: ServiceStat[] = Array.from(serviceMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({
            name,
            count,
            percentage:
              totalServiceBookings > 0
                ? Math.round((count / totalServiceBookings) * 100)
                : 0,
          }));

        setStats({
          totalRevenue: paidRevenue + outstandingRevenue,
          paidRevenue,
          outstandingRevenue,
          total: appointments.length,
          completed,
          pending,
          cancelled,
          topServices,
          totalClients,
        });
      } catch (err) {
        console.error("useStatistics error:", getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [apptService, clientService],
  );

  useEffect(() => {
    load(month);
  }, [load, month]);

  const goToPreviousMonth = () => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    if (next <= new Date()) setMonth(next);
  };

  const isCurrentMonth =
    month.getMonth() === new Date().getMonth() &&
    month.getFullYear() === new Date().getFullYear();

  return {
    stats,
    loading,
    month,
    isCurrentMonth,
    goToPreviousMonth,
    goToNextMonth,
    refresh: () => load(month),
  };
}
