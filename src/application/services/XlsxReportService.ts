import { AppointmentWithDetails } from "@/src/domain/entities/Appointment";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";

export class XlsxReportService {
  /**
   * Generates an XLSX report for a list of appointments and opens the share dialog.
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
      const dateFormat = language === "en" ? "MM/dd/yyyy HH:mm" : "dd/MM/yyyy HH:mm";

      // Calculate Metrics
      let totalPaid = 0;
      let totalUnpaid = 0;

      const data = appointments.map((appt) => {
        const isPaid = appt.paymentStatus === "paid";
        if (appt.status !== "cancelled") {
          if (isPaid) totalPaid += appt.totalPrice;
          else totalUnpaid += appt.totalPrice;
        }

        const dateStr = format(new Date(appt.date), dateFormat, {
          locale,
        });

        const methodKey = `method_${appt.paymentMethod?.replace("ó", "o").replace("/", "_").toLowerCase()}`;
        const methodStr = (t.appointments as any)[methodKey] || t.appointments.method_other || appt.paymentMethod || "-";

        return {
          [ts.tableFecha]: dateStr,
          [ts.tableCliente]: appt.clientName,
          [ts.tableServicios]: appt.services.map((s: any) => s.name).join(", "),
          [ts.tableImporte]: appt.totalPrice,
          [ts.tableFormaPago]: methodStr,
          [ts.tableFacturado]: appt.isFacturado ? (language === "es" ? "SÍ" : "YES") : "NO",
          [ts.tablePagoPendiente]: !isPaid ? appt.totalPrice : 0,
        };
      });

      // Add totals at the end
      data.push({} as any); // Empty row
      data.push({
        [ts.tableFecha]: ts.totalPaid,
        [ts.tableCliente]: totalPaid,
      } as any);
      data.push({
        [ts.tableFecha]: ts.totalUnpaid,
        [ts.tableCliente]: totalUnpaid,
      } as any);
      data.push({
        [ts.tableFecha]: ts.grandTotal,
        [ts.tableCliente]: totalPaid + totalUnpaid,
      } as any);

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Caja");

      const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
      // @ts-ignore
      const uri = FileSystem.cacheDirectory + `reporte_${Date.now()}.xlsx`;

      await FileSystem.writeAsStringAsync(uri, wbout, {
        // @ts-ignore
        encoding: FileSystem.EncodingType.Base64,
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: title,
        });
      } else {
        Alert.alert(t.common.attention, t.backup.sharingUnavailable);
      }
    } catch (error) {
      console.error("XLSX generation failed:", error);
      Alert.alert(t.common.error, "Ocurrió un error al generar el reporte Excel.");
    }
  }
}
