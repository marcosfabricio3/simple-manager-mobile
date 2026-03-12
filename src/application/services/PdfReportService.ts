import { AppointmentRepository } from "@/src/infrastructure/repositories/AppointmentRepository";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

export class PdfReportService {
  private appointmentRepo: AppointmentRepository;

  constructor() {
    this.appointmentRepo = new AppointmentRepository();
  }

  /**
   * Generates a PDF report for the current month and opens the share dialog.
   */
  async generateMonthlyReport(): Promise<void> {
    try {
      const now = new Date();
      const startDate = startOfMonth(now);
      const endDate = endOfMonth(now);

      const startDateIso = startDate.toISOString();
      const endDateIso = endDate.toISOString();

      const appointments = await this.appointmentRepo.findBetweenDates(
        startDateIso,
        endDateIso,
      );

      // Calculate Metrics
      let totalIncome = 0;
      let totalDebt = 0;
      let completedCount = 0;
      let cancelledCount = 0;

      appointments.forEach((appt) => {
        if (appt.status === "cancelled") {
          cancelledCount++;
          return;
        }

        if (appt.status === "completed") {
          completedCount++;
        }

        if (appt.paymentStatus === "paid") {
          totalIncome += appt.totalPrice;
        } else if (appt.paymentStatus === "unpaid") {
          totalDebt += appt.totalPrice;
        }
      });

      const monthName = format(now, "MMMM yyyy", { locale: es }).toUpperCase();

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
              h1 { color: #007AFF; font-size: 32px; margin-bottom: 5px; }
              h2 { font-size: 18px; color: #8E8E93; text-transform: uppercase; margin-top: 0; margin-bottom: 30px; border-bottom: 2px solid #E5E5EA; padding-bottom: 15px; }
              .metrics-container { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 40px; }
              .metric-card { flex: 1; min-width: 200px; padding: 20px; background-color: #F2F2F7; border-radius: 12px; }
              .metric-title { font-size: 14px; color: #8E8E93; text-transform: uppercase; margin-bottom: 8px; font-weight: bold; }
              .metric-value { font-size: 32px; font-weight: bold; color: #1C1C1E; }
              .metric-income { color: #34C759; }
              .metric-debt { color: #FF3B30; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { text-align: left; padding: 12px; border-bottom: 1px solid #E5E5EA; }
              th { background-color: #F2F2F7; font-weight: bold; color: #8E8E93; text-transform: uppercase; font-size: 12px; }
              tr:nth-child(even) { background-color: #FAFAFA; }
              .status-paid { color: #34C759; font-weight: bold; }
              .status-unpaid { color: #FF3B30; font-weight: bold; }
              .status-cancelled { color: #8E8E93; text-decoration: line-through; }
            </style>
          </head>
          <body>
            <h1>Resumen de Negocio</h1>
            <h2>Reporte Mensual - ${monthName}</h2>

            <div class="metrics-container">
              <div class="metric-card">
                <div class="metric-title">Ingresos Totales (Pagado)</div>
                <div class="metric-value metric-income">$${totalIncome.toFixed(2)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-value" style="font-size: 24px; margin-bottom: 10px;">
                  Turnos Completados: <span style="color: #007AFF;">${completedCount}</span>
                </div>
                <div class="metric-value" style="font-size: 18px; color: #8E8E93;">
                  Turnos Cancelados: ${cancelledCount}
                </div>
              </div>
            </div>
            
            <div class="metrics-container" style="margin-top: -20px;">
              <div class="metric-card" style="background-color: #FFF2F2; border: 1px solid #FFD1D1;">
                <div class="metric-title" style="color: #FF3B30;">Deuda Pendiente (Por Cobrar)</div>
                <div class="metric-value metric-debt">$${totalDebt.toFixed(2)}</div>
              </div>
            </div>

            <h3>Detalle de Turnos (${appointments.length})</h3>
            <table>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Monto</th>
              </tr>
              ${appointments
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
                )
                .map((appt) => {
                  const dateStr = format(
                    new Date(appt.date),
                    "dd/MM/yy HH:mm",
                    { locale: es },
                  );
                  let statusHtml = "";
                  if (appt.status === "cancelled") {
                    statusHtml =
                      '<span class="status-cancelled">Cancelado</span>';
                  } else if (appt.paymentStatus === "paid") {
                    statusHtml = '<span class="status-paid">Pagado</span>';
                  } else {
                    statusHtml = '<span class="status-unpaid">Adeudado</span>';
                  }

                  return `
                  <tr>
                    <td>${dateStr}</td>
                    <td>${appt.clientName}</td>
                    <td>${
                      appt.status === "completed"
                        ? "Completado"
                        : appt.status === "pending"
                          ? "Pendiente"
                          : "Cancelado"
                    }</td>
                    <td>${statusHtml}</td>
                    <td>$${appt.totalPrice.toFixed(2)}</td>
                  </tr>
                `;
                })
                .join("")}
            </table>
            
            <p style="margin-top: 50px; text-align: center; color: #8E8E93; font-size: 12px;">
              Generado automáticamente por Simple Manager el ${format(now, "dd/MM/yyyy HH:mm")}
            </p>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Compartir Reporte",
          UTI: "com.adobe.pdf", // iOS specific
        });
      } else {
        Alert.alert(
          "Atención",
          "La funcionalidad de compartir no está disponible en tu dispositivo.",
        );
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      Alert.alert(
        "Error",
        "Ocurrió un error al intentar generar el reporte en PDF.",
      );
    }
  }
}
