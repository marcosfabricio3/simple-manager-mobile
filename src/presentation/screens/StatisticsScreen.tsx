import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { useStatistics } from "@/src/presentation/hooks/useStatistics";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeTopPadding } from "@/src/presentation/hooks/useSafeTopPadding";

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function StatisticsScreen() {
  const { darkMode, language } = useSettingsStore();
  const colors = Colors[darkMode ? "dark" : "light"];
  const { t } = useI18n();
  const ts = t.statistics;
  const paddingTop = useSafeTopPadding();

  const {
    stats,
    loading,
    month,
    isCurrentMonth,
    goToPreviousMonth,
    goToNextMonth,
  } = useStatistics();

  const monthLabel = formatMonthYear(month, language);

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
              value={formatCurrency(stats.paidRevenue)}
              color={colors.success}
              icon="check-circle"
              colors={colors}
            />
            <StatCard
              label={ts.outstanding}
              value={formatCurrency(stats.outstandingRevenue)}
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
              {ts.total}: {formatCurrency(stats.totalRevenue)}
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
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 8,
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
