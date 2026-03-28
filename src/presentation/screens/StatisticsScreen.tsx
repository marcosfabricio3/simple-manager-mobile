import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { useStatistics } from "@/src/presentation/hooks/useStatistics";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
} from "react-native";
import { useSafeTopPadding } from "@/src/presentation/hooks/useSafeTopPadding";
import { PdfReportService } from "@/src/application/services/PdfReportService";
import { XlsxReportService } from "@/src/application/services/XlsxReportService";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
function formatCurrency(amount: number, currency: string = "$"): string {
  return `${currency}${amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatMonthYear(date: Date, language: string): string {
  return date.toLocaleDateString(language === "es" ? "es-AR" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  color,
  icon,
  colors,
}: {
  label: string;
  value: string;
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  colors: (typeof Colors)["light"];
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={[styles.statIconWrap, { backgroundColor: color + "18" }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.subtext }]}>{label}</Text>
    </View>
  );
}

function ProgressBar({
  label,
  count,
  total,
  color,
  colors,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  colors: (typeof Colors)["light"];
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.progressRow}>
      <View style={styles.progressLabelRow}>
        <Text style={[styles.progressLabel, { color: colors.text }]}>
          {label}
        </Text>
        <Text style={[styles.progressCount, { color: colors.subtext }]}>
          {count}
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` as any,
            },
          ]}
        />
      </View>
    </View>
  );
}

function ServiceBar({
  name,
  count,
  percentage,
  rank,
  colors,
}: {
  name: string;
  count: number;
  percentage: number;
  rank: number;
  colors: (typeof Colors)["light"];
}) {
  const rankColors = ["#7C9CF5", "#A8DADC", "#F4A6A6", "#FFD93D", "#6BCB77"];
  const barColor = rankColors[rank] ?? colors.primary;

  return (
    <View style={styles.serviceRow}>
      <View
        style={[styles.serviceRankBadge, { backgroundColor: barColor + "20" }]}
      >
        <Text style={[styles.serviceRank, { color: barColor }]}>
          {rank + 1}
        </Text>
      </View>
      <View style={styles.serviceInfo}>
        <View style={styles.serviceLabelRow}>
          <Text
            style={[styles.serviceName, { color: colors.text }]}
            numberOfLines={1}
          >
            {name}
          </Text>
          <Text style={[styles.serviceCount, { color: colors.subtext }]}>
            {count}
          </Text>
        </View>
        <View style={[styles.serviceTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.serviceFill,
              {
                backgroundColor: barColor,
                width:
                  `${Math.max(percentage, percentage > 0 ? 4 : 0)}%` as any,
              },
            ]}
          />
        </View>
        <Text style={[styles.servicePct, { color: colors.subtext }]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
}

function PaymentMethodBar({
  method,
  count,
  amount,
  totalRevenue,
  colors,
  t,
}: {
  method: string;
  count: number;
  amount: number;
  totalRevenue: number;
  colors: (typeof Colors)["light"];
  t: any;
}) {
  const percentage = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
  
  // Choose color based on method
  let barColor = colors.primary;
  switch (method) {
    case "efectivo": barColor = "#4CAF50"; break; // Green
    case "debito_credito": barColor = "#2196F3"; break; // Blue
    case "mercado_pago": barColor = "#00B1EA"; break; // Light Blue
    case "transferencia": barColor = "#9C27B0"; break; // Purple
    default: barColor = "#FF9800"; break; // Orange (otros)
  }

  // Translate method name if possible
  const methodKey = `method_${method.replace("ó", "o").replace("/", "_").toLowerCase()}`;
  let translatedName = (t.appointments as any)[methodKey] || t.appointments.method_other || method;
  
  if (method === "unknown") translatedName = t.statistics.unknown || method;

  return (
    <View style={styles.serviceRow}>
      <View style={styles.serviceInfo}>
        <View style={styles.serviceLabelRow}>
          <Text
            style={[styles.serviceName, { color: colors.text, flex: 1 }]}
            numberOfLines={1}
          >
            {translatedName}
          </Text>
          <Text style={[styles.serviceCount, { color: colors.text }]}>
            {formatCurrency(amount, t.common.currency)}
          </Text>
        </View>
        <View style={[styles.serviceTrack, { backgroundColor: colors.border, marginTop: 4 }]}>
          <View
            style={[
              styles.serviceFill,
              {
                backgroundColor: barColor,
                width: `${Math.max(percentage, percentage > 0 ? 4 : 0)}%` as any,
              },
            ]}
          />
        </View>
        <Text style={[styles.servicePct, { color: colors.subtext, marginTop: 4 }]}>
          {count} {count === 1 ? t.appointments.total : t.statistics.bookings} • {percentage.toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function StatisticsScreen() {
  const { darkMode, language } = useSettingsStore();
  const colors = Colors[darkMode ? "dark" : "light"];
  const { t } = useI18n();
  const ts = t.statistics;
  const paddingTop = useSafeTopPadding();

  const [exporting, setExporting] = useState(false);

  const {
    stats,
    loading,
    month,
    isCurrentMonth,
    goToPreviousMonth,
    goToNextMonth,
    getYearlyAppointments,
  } = useStatistics();

  const monthLabel = formatMonthYear(month, language);

  const handleExport = async (type: "pdf" | "xlsx", period: "month" | "year") => {
    try {
      setExporting(true);
      const pdfService = new PdfReportService();
      const xlsxService = new XlsxReportService();

      let appointments = stats.appointments;
      let title = `${period === "month" ? ts.monthlyReport : ts.yearlyReport} - ${
        period === "month" 
          ? formatMonthYear(month, language) 
          : month.getFullYear().toString()
      }`;

      if (period === "year") {
        appointments = await getYearlyAppointments();
      }

      if (type === "pdf") {
        await pdfService.generateReport(appointments, title, t, language);
      } else {
        await xlsxService.generateReport(appointments, title, t, language);
      }
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert(t.common.error, "Error al generar el reporte.");
    } finally {
      setExporting(false);
    }
  };

  const showExportMenu = () => {
    Alert.alert(
      ts.exportReport,
      "",
      [
        { text: `${ts.monthlyReport} (PDF)`, onPress: () => handleExport("pdf", "month") },
        { text: `${ts.monthlyReport} (XLSX)`, onPress: () => handleExport("xlsx", "month") },
        { text: `${ts.yearlyReport} (PDF)`, onPress: () => handleExport("pdf", "year") },
        { text: `${ts.yearlyReport} (XLSX)`, onPress: () => handleExport("xlsx", "year") },
        { text: t.common.cancel, style: "cancel" },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingTop,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />

      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {ts.title}
        </Text>
        <TouchableOpacity 
          style={[styles.exportBtn, { backgroundColor: colors.primary }]}
          onPress={showExportMenu}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <MaterialIcons name="file-download" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Month navigation */}
      <View style={[styles.monthNav, { backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthBtn}>
          <MaterialIcons name="chevron-left" size={26} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.text }]}>
          {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
        </Text>
        <TouchableOpacity
          onPress={goToNextMonth}
          style={[styles.monthBtn, isCurrentMonth && styles.monthBtnDisabled]}
          disabled={isCurrentMonth}
        >
          <MaterialIcons
            name="chevron-right"
            size={26}
            color={isCurrentMonth ? colors.border : colors.primary}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subtext }]}>
            {ts.loading}
          </Text>
        </View>
      ) : (
        <>
          {/* Revenue Section */}
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
            {ts.monthlyRevenue}
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              label={ts.paid}
              value={formatCurrency(stats.paidRevenue, t.common.currency)}
              color={colors.success}
              icon="check-circle"
              colors={colors}
            />
            <StatCard
              label={ts.outstanding}
              value={formatCurrency(stats.outstandingRevenue, t.common.currency)}
              color={colors.warning}
              icon="schedule"
              colors={colors}
            />
          </View>
          <View
            style={[
              styles.totalRevenueCard,
              {
                backgroundColor: colors.primary + "12",
                borderColor: colors.primary + "30",
              },
            ]}
          >
            <MaterialIcons
              name="account-balance-wallet"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.totalRevenueLabel, { color: colors.primary }]}>
              {" "}
              {ts.total}: {formatCurrency(stats.totalRevenue, t.common.currency)}
            </Text>
          </View>

          {/* Appointments Section */}
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
            {ts.appointments}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {stats.total === 0 ? (
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                {ts.noData}
              </Text>
            ) : (
              <>
                <ProgressBar
                  label={ts.completed}
                  count={stats.completed}
                  total={stats.total}
                  color={colors.success}
                  colors={colors}
                />
                <ProgressBar
                  label={ts.pending}
                  count={stats.pending}
                  total={stats.total}
                  color={colors.info}
                  colors={colors}
                />
                <ProgressBar
                  label={ts.cancelled}
                  count={stats.cancelled}
                  total={stats.total}
                  color={colors.danger}
                  colors={colors}
                />
              </>
            )}
          </View>

          {/* Top Services Section */}
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
            {ts.topServices}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {stats.topServices.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                {ts.noServices}
              </Text>
            ) : (
              stats.topServices.map((svc, i) => (
                <ServiceBar
                  key={svc.name}
                  name={svc.name}
                  count={svc.count}
                  percentage={svc.percentage}
                  rank={i}
                  colors={colors}
                />
              ))
            )}
          </View>

          {/* Payment Methods Section */}
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
            {ts.paymentMethods}
          </Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {stats.paymentMethods.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                {ts.noData}
              </Text>
            ) : (
              stats.paymentMethods.map((method, i) => (
                <View key={method.method}>
                  <PaymentMethodBar
                    method={method.method}
                    count={method.count}
                    amount={method.amount}
                    totalRevenue={stats.paidRevenue}
                    colors={colors}
                    t={t}
                  />
                  {i < stats.paymentMethods.length - 1 && (
                    <View style={{ height: 16 }} />
                  )}
                </View>
              ))
            )}
          </View>

          {/* Caja Section */}
          <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
            {ts.caja}
          </Text>
          <View style={[styles.cajaCard, { backgroundColor: colors.card }]}>
            {stats.appointments.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.subtext }]}>
                {ts.noData}
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tableContainer}>
                  <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.columnHeader, { color: colors.subtext, width: 80 }]}>{ts.tableFecha}</Text>
                    <Text style={[styles.columnHeader, { color: colors.subtext, width: 120 }]}>{ts.tableCliente}</Text>
                    <Text style={[styles.columnHeader, { color: colors.subtext, width: 140 }]}>{ts.tableServicios}</Text>
                    <Text style={[styles.columnHeader, { color: colors.subtext, width: 100, textAlign: 'right' }]}>{ts.tableImporte}</Text>
                    <Text style={[styles.columnHeader, { color: colors.subtext, width: 120, marginLeft: 15 }]}>{ts.tableFormaPago}</Text>
                    <Text style={[styles.columnHeader, { color: colors.subtext, width: 80, textAlign: 'center' }]}>{ts.tableFacturado}</Text>
                    <Text style={[styles.columnHeader, { color: colors.subtext, width: 90, textAlign: 'right' }]}>{ts.tablePagoPendiente}</Text>
                  </View>
                  {stats.appointments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((appt, i) => {
                      const isPaid = appt.paymentStatus === 'paid';
                      const methodKey = `method_${appt.paymentMethod?.replace("ó", "o").replace("/", "_").toLowerCase()}`;
                      const methodStr = (t.appointments as any)[methodKey] || t.appointments.method_other || appt.paymentMethod || "-";

                      return (
                        <View key={appt.id} style={[styles.tableRow, { borderBottomColor: colors.border + '40' }]}>
                          <Text style={[styles.cell, { color: colors.text, width: 80 }]}>
                            {format(new Date(appt.date), "dd/MM/yy", { locale: es })}
                          </Text>
                          <Text style={[styles.cell, { color: colors.text, width: 120 }]} numberOfLines={1}>
                            {appt.clientName}
                          </Text>
                          <Text style={[styles.cell, { color: colors.text, width: 140 }]} numberOfLines={2}>
                            {appt.services.map(s => s.name).join(", ")}
                          </Text>
                           <Text style={[styles.cell, { color: colors.text, width: 100, textAlign: 'right', fontWeight: '700' }]}>
                            {formatCurrency(appt.totalPrice, t.common.currency)}
                          </Text>
                          <Text style={[styles.cell, { color: colors.text, width: 120, marginLeft: 15 }]} numberOfLines={1}>
                            {methodStr}
                          </Text>
                          <View style={{ width: 80, alignItems: 'center' }}>
                            <MaterialIcons 
                              name={isPaid && appt.isFacturado ? "check-circle" : "cancel"} 
                              size={18} 
                              color={isPaid && appt.isFacturado ? colors.success : colors.danger} 
                            />
                          </View>
                          <Text style={[styles.cell, { color: isPaid ? colors.success : colors.danger, width: 90, textAlign: 'right', fontWeight: '800' }]}>
                            {isPaid ? "-" : formatCurrency(appt.totalPrice, t.common.currency)}
                          </Text>
                        </View>
                      );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          {/* Total Clients */}
          <View style={[styles.clientsCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.clientsIcon,
                { backgroundColor: colors.secondary + "25" },
              ]}
            >
              <MaterialIcons name="people" size={24} color={colors.secondary} />
            </View>
            <View>
              <Text style={[styles.clientsCount, { color: colors.text }]}>
                {stats.totalClients}
              </Text>
              <Text style={[styles.clientsLabel, { color: colors.subtext }]}>
                {ts.totalClients}
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  exportBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 24,
  },
  monthBtn: { padding: 4 },
  monthBtnDisabled: { opacity: 0.3 },
  monthLabel: {
    fontSize: 16,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 6,
    marginLeft: 2,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, fontWeight: "600" },
  totalRevenueCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
  },
  totalRevenueLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  cajaCard: {
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 24,
  },
  tableContainer: {
    paddingHorizontal: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 5,
  },
  columnHeader: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  cell: {
    fontSize: 12,
    marginRight: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 16,
  },
  progressRow: { gap: 6 },
  progressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: { fontSize: 14, fontWeight: "600" },
  progressCount: { fontSize: 14, fontWeight: "700" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  serviceRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceRank: { fontSize: 14, fontWeight: "800" },
  serviceInfo: { flex: 1, gap: 4 },
  serviceLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  serviceName: { fontSize: 14, fontWeight: "600", flex: 1 },
  serviceCount: { fontSize: 14, fontWeight: "700" },
  serviceTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  serviceFill: {
    height: "100%",
    borderRadius: 3,
  },
  servicePct: { fontSize: 11, fontWeight: "600", textAlign: "right" },
  clientsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderRadius: 14,
    padding: 18,
    marginBottom: 8,
  },
  clientsIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  clientsCount: { fontSize: 28, fontWeight: "800" },
  clientsLabel: { fontSize: 13, fontWeight: "600" },
  loadingWrap: {
    paddingTop: 80,
    alignItems: "center",
    gap: 16,
  },
  loadingText: { fontSize: 14 },
});
