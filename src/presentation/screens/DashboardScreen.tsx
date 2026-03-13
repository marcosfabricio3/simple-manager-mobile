import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { AppointmentCard } from "@/src/presentation/components/AppointmentCard";
import { EmptyState } from "@/src/presentation/components/EmptyState";
import { useDashboard } from "@/src/presentation/hooks/useDashboard";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function DashboardScreen() {
  const { todayAppointments, loading, refresh } = useDashboard();
  const { darkMode, language } = useSettingsStore();
  const { t } = useI18n();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const stats = useMemo(() => {
    const pending = todayAppointments.filter((a) => a.status === "pending");
    const cancelled = todayAppointments.filter((a) => a.status === "cancelled");
    const now = new Date();

    const next = todayAppointments
      .filter((a) => a.status === "pending" && new Date(a.date) >= now)
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    return {
      total: todayAppointments.length,
      pending: pending.length,
      cancelled: cancelled.length,
      nextClient: next ? next.clientName : t.common.none,
    };
  }, [todayAppointments, t]);

  const MetricCard = ({
    title,
    value,
    icon,
    color,
    index,
  }: {
    title: string;
    value: string | number;
    icon: keyof typeof MaterialIcons.glyphMap;
    color: string;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(500)}
      style={[
        styles.metricCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: color + "10" }]}>
        <MaterialIcons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.metricLabel, { color: colors.subtext }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          style={[styles.metricValue, { color: colors.text }]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />

      <FlatList
        data={todayAppointments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.welcomeRow}>
              <Text style={[styles.greeting, { color: colors.subtext }]}>
                {t.dashboard.greeting}
              </Text>
              <Text style={[styles.title, { color: colors.text }]}>
                {t.dashboard.title}
              </Text>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.row}>
                <MetricCard
                  index={0}
                  title={t.dashboard.totalToday}
                  value={stats.total}
                  icon="event-note"
                  color={colors.primary}
                />
                <MetricCard
                  index={1}
                  title={t.dashboard.pending}
                  value={stats.pending}
                  icon="schedule"
                  color={colors.warning}
                />
              </View>
              <View style={styles.row}>
                <MetricCard
                  index={2}
                  title={t.dashboard.cancelled}
                  value={stats.cancelled}
                  icon="event-busy"
                  color={colors.danger}
                />
                <MetricCard
                  index={3}
                  title={t.dashboard.next}
                  value={stats.nextClient}
                  icon="person"
                  color={colors.secondary}
                />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {t.dashboard.appointmentList}
              </Text>
              <TouchableOpacity onPress={() => router.push("/explore")}>
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  {t.dashboard.viewAll}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            iconName="calendar-today"
            title={language === "es" ? "Sin actividad" : "No activity"}
            description={t.dashboard.empty}
          />
        }
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onDelete={refresh}
            onEdit={(id) => router.push(`/appointments/edit?id=${id}`)}
          />
        )}
      />

      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.fab,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
        ]}
        onPress={() => router.push("/appointments/create")}
      >
        <MaterialIcons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  header: {
    paddingTop: 60,
    marginBottom: 20,
  },
  welcomeRow: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  metricsGrid: {
    gap: 12,
    marginBottom: 32,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
});
