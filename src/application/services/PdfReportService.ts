import { AppointmentWithDetails } from "@/src/domain/entities/Appointment";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";

export class PdfReportService {
  /**
   * Generates a PDF report for a given list of appointments and opens the share dialog.
   */
  async generateReport(
    appointments: AppointmentWithDetails[],
    title: string,
    t: any,
    language: "en" | "es" = "es"
  ): Promise<void> {
    try {
      const ts = t.statistics;
      const locale = language === "en" ? enUS : es;
      const dateFormat = language === "en" ? "MM/dd/yy HH:mm" : "dd/MM/yy HH:mm";
      const fullDateFormat = language === "en" ? "MM/dd/yyyy HH:mm" : "dd/MM/yyyy HH:mm";
      
      // Calculate Metrics
      let totalPaid = 0;
      let totalUnpaid = 0;

      appointments.forEach((appt) => {
        if (appt.status === "cancelled") {
          return;
        }

        if (appt.paymentStatus === "paid") {
          totalPaid += appt.totalPrice;
        } else {
          totalUnpaid += appt.totalPrice;
        }
      });

      const now = new Date();
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007AFF; padding-bottom: 10px; }
              h1 { color: #007AFF; font-size: 24px; margin-bottom: 5px; }
              h2 { font-size: 16px; color: #8E8E93; text-transform: uppercase; margin-top: 0; }
              
              .metrics-container { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 30px; }
              .metric-card { flex: 1; min-width: 140px; padding: 15px; background-color: #F2F2F7; border-radius: 10px; }
              .metric-title { font-size: 11px; color: #8E8E93; text-transform: uppercase; margin-bottom: 5px; font-weight: bold; }
              .metric-value { font-size: 22px; font-weight: bold; color: #1C1C1E; }
              .metric-income { color: #34C759; }
              .metric-debt { color: #FF3B30; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
              th, td { text-align: left; padding: 8px; border-bottom: 1px solid #E5E5EA; }
              th { background-color: #F2F2F7; font-weight: bold; color: #8E8E93; text-transform: uppercase; }
              tr:nth-child(even) { background-color: #FAFAFA; }
              .status-paid { color: #34C759; font-weight: bold; }
              .status-unpaid { color: #FF3B30; font-weight: bold; }
              .status-cancelled { color: #8E8E93; text-decoration: line-through; }
              
              .totals-box { margin-top: 30px; padding: 15px; background-color: #F2F2F7; border-radius: 10px; border-left: 5px solid #007AFF; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
              .total-label { font-weight: bold; }
              .grand-total { font-size: 18px; margin-top: 10px; border-top: 1px solid #CCC; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Simple Manager</h1>
              <h2>${title}</h2>
            </div>

            <div class="metrics-container">
              <div class="metric-card">
                <div class="metric-title">${ts.totalPaid}</div>
                <div class="metric-value metric-income">$${totalPaid.toFixed(0)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">${ts.totalUnpaid}</div>
                <div class="metric-value metric-debt">$${totalUnpaid.toFixed(0)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">${ts.grandTotal}</div>
                <div class="metric-value" style="color: #007AFF;">$${(totalPaid + totalUnpaid).toFixed(0)}</div>
              </div>
            </div>

            <table>
              <tr>
                <th>${ts.tableFecha}</th>
                <th>${ts.tableCliente}</th>
                <th>${ts.tableServicios}</th>
                <th>${ts.tableImporte}</th>
                <th>${ts.tableFormaPago}</th>
                <th>${ts.tableFacturado}</th>
                <th>${ts.tablePagoPendiente}</th>
              </tr>
              ${appointments
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((appt) => {
                  const dateStr = format(new Date(appt.date), dateFormat, { locale });
                  const isPaid = appt.paymentStatus === "paid";
                  
                  const methodKey = `method_${appt.paymentMethod?.replace("ó", "o").replace("/", "_").toLowerCase()}`;
                  const methodStr = (t.appointments as any)[methodKey] || t.appointments.method_other || appt.paymentMethod || "-";

                  return `
                  <tr>
                    <td>${dateStr}</td>
                    <td>${appt.clientName}</td>
                    <td>${appt.services.map((s) => s.name).join(", ")}</td>
                    <td>$${appt.totalPrice.toFixed(0)}</td>
                    <td>${methodStr}</td>
                    <td style="text-align: center;">${appt.isFacturado ? "✓" : "✗"}</td>
                    <td class="${isPaid ? "status-paid" : "status-unpaid"}">
                      ${isPaid ? "-" : `$${appt.totalPrice.toFixed(0)}`}
                    </td>
                  </tr>
                `;
                })
                .join("")}
            </table>
            
            <div class="totals-box">
              <div class="total-row">
                <span class="total-label">${ts.totalPaid}:</span>
                <span style="color: #34C759;">$${totalPaid.toFixed(0)}</span>
              </div>
              <div class="total-row">
                <span class="total-label">${ts.totalUnpaid}:</span>
                <span style="color: #FF3B30;">$${totalUnpaid.toFixed(0)}</span>
              </div>
              <div class="total-row grand-total">
                <span class="total-label">${ts.grandTotal}:</span>
                <span style="color: #007AFF;">$${(totalPaid + totalUnpaid).toFixed(0)}</span>
              </div>
            </div>

            <p style="margin-top: 40px; text-align: center; color: #8E8E93; font-size: 10px;">
              ${language === "en" ? "Generated on" : "Generado el"} ${format(now, fullDateFormat)}
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
          dialogTitle: title,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert(t.common.attention, t.backup.sharingUnavailable);
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      Alert.alert(t.common.error, "Error al generar PDF.");
    }
  }
}
