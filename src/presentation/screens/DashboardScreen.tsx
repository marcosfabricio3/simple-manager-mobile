import { ColorValue, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl, StatusBar, Platform, FlatList } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useCallback, useState, useEffect } from "react";
import { useSafeTopPadding } from "@/src/presentation/hooks/useSafeTopPadding";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { useDashboard } from "@/src/presentation/hooks/useDashboard";
import { useFocusEffect } from "@react-navigation/native";
import { Colors, Spacing } from "@/constants/theme";
import { AppointmentCard } from "@/src/presentation/components/AppointmentCard";
import { AppointmentRepository } from "@/src/infrastructure/repositories/AppointmentRepository";
import { AppointmentWithDetails } from "@/src/domain/entities/Appointment";
import { EmptyState } from "@/src/presentation/components/EmptyState";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function DashboardScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<"none" | "pending" | "cancelled" | "next">("none");
  const { todayAppointments, loading, refresh } = useDashboard(selectedDate);
  const { darkMode, language } = useSettingsStore();
  const { t } = useI18n();
  const paddingTop = useSafeTopPadding();
  const router = useRouter();

  // For "Next Client" global search
  const [nextAppointment, setNextAppointment] = useState<AppointmentWithDetails | null>(null);

  useEffect(() => {
    if (activeFilter === "next") {
      const fetchNext = async () => {
        const repo = new AppointmentRepository();
        const upcoming = await repo.findUpcoming();
        const now = new Date();
        const next = upcoming.find((a: AppointmentWithDetails) => {
          const endTime = new Date(new Date(a.date).getTime() + a.durationMinutes * 60000);
          return a.status === "pending" && endTime > now;
        });
        setNextAppointment(next || null);
        if (next) {
          setSelectedDate(new Date(next.date));
        }
      };
      fetchNext();
    }
  }, [activeFilter]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const { stats, displayAppointments, displayDateLabel } = useMemo(() => {
    const now = new Date();
    const pending = todayAppointments.filter((a) => a.status === "pending");
    const cancelled = todayAppointments.filter((a) => a.status === "cancelled");

    let filtered = todayAppointments;
    let label = selectedDate.toLocaleDateString(language === "es" ? "es-AR" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    if (activeFilter === "pending") {
      filtered = pending.filter(a => {
        const endTime = new Date(new Date(a.date).getTime() + a.durationMinutes * 60000);
        return endTime >= now;
      });
    } else if (activeFilter === "cancelled") {
      filtered = cancelled;
    } else if (activeFilter === "next") {
      if (nextAppointment) {
        filtered = [nextAppointment];
        label = new Date(nextAppointment.date).toLocaleDateString(language === "es" ? "es-AR" : "en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      } else {
        filtered = [];
      }
    }

    const nextToday = todayAppointments
      .filter((a) => a.status === "pending" && new Date(new Date(a.date).getTime() + a.durationMinutes * 60000) > now)
      .sort((a, b) => a.date.localeCompare(b.date))[0];

    const mapped = filtered
      .map((a) => {
        const endTime = new Date(new Date(a.date).getTime() + a.durationMinutes * 60000);
        return { ...a, isPast: endTime < now };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      stats: {
        total: todayAppointments.length,
        pending: pending.length,
        cancelled: cancelled.length,
        nextClient: nextToday ? nextToday.clientName : t.common.none,
      },
      displayAppointments: mapped,
      displayDateLabel: label,
    };
  }, [todayAppointments, t, activeFilter, nextAppointment, selectedDate, language]);

  const MetricCard = ({
    title,
    value,
    icon,
    color,
    index,
    isActive,
    onPress,
  }: {
    title: string;
    value: string | number;
    icon: keyof typeof Feather.glyphMap;
    color: string;
    index: number;
    isActive?: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{ flex: 1 }}
    >
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(500)}
        style={[
          styles.metricCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          isActive && {
            borderColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 5,
            elevation: 4,
            borderWidth: 1.5,
          },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: color + "15" }]}>
          <Feather name={icon} size={16} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[styles.metricLabel, { color: colors.subtext }, isActive && { color: color }]}
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
    </TouchableOpacity>
  );

  const changeDay = (offset: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + offset);
    setSelectedDate(next);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === "dark" ? "light-content" : "dark-content"} />

      <FlatList
        data={displayAppointments}
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
          <View
            style={[
              styles.header,
              {
                paddingTop,
              },
            ]}
          >
            <View style={styles.headerTop}>
              <View style={styles.welcomeRow}>
                <Text style={[styles.greeting, { color: colors.subtext }]}>
                  {t.dashboard.greeting}
                </Text>
                <Text style={[styles.title, { color: colors.text }]}>
                  {t.dashboard.title}
                </Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.row}>
                <MetricCard
                  index={0}
                  title={t.dashboard.totalToday}
                  value={stats.total}
                  icon="calendar"
                  color={colors.primary}
                  isActive={false} // Jumps back to today
                  onPress={() => {
                    setSelectedDate(new Date());
                    setActiveFilter("none");
                  }}
                />
                <MetricCard
                  index={1}
                  title={t.dashboard.pending}
                  value={stats.pending}
                  icon="clock"
                  color={colors.warning}
                  isActive={activeFilter === "pending"}
                  onPress={() => setActiveFilter(activeFilter === "pending" ? "none" : "pending")}
                />
              </View>
              <View style={styles.row}>
                <MetricCard
                  index={2}
                  title={t.dashboard.cancelled}
                  value={stats.cancelled}
                  icon="slash"
                  color={colors.danger}
                  isActive={activeFilter === "cancelled"}
                  onPress={() => setActiveFilter(activeFilter === "cancelled" ? "none" : "cancelled")}
                />
                <MetricCard
                  index={3}
                  title={stats.nextClient !== t.common.none ? stats.nextClient : t.dashboard.next}
                  value={t.dashboard.next}
                  icon="user"
                  color={colors.secondary}
                  isActive={activeFilter === "next"}
                  onPress={() => setActiveFilter(activeFilter === "next" ? "none" : "next")}
                />
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View style={styles.dateSelector}>
                <TouchableOpacity onPress={() => changeDay(-1)} style={styles.navBtn}>
                  <Feather name="chevron-left" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t.dashboard.appointmentsFor} {displayDateLabel}
                </Text>
                <TouchableOpacity onPress={() => changeDay(1)} style={styles.navBtn}>
                  <Feather name="chevron-right" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity 
                onPress={() => {
                  setActiveFilter("none");
                  setSelectedDate(new Date());
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  {t.common.cleanFilters}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            iconName="calendar"
            title={t.dashboard.noActivity}
            description={t.dashboard.empty}
          />
        }
        renderItem={({ item }: { item: AppointmentWithDetails & { isPast: boolean } }) => (
          <AppointmentCard
            appointment={item}
            onEdit={(id) => router.push(`/appointments/edit?id=${id}` as any)}
            onDelete={() => refresh()}
            isPast={item.isPast}
            onStatusUpdate={refresh}
          />
        )}
      />

      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          styles.headerAddBtnFixed, 
          { 
            backgroundColor: colors.primary,
            top: paddingTop + Spacing.s,
          }
        ]}
        onPress={() => router.push("/appointments/create" as any)}
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: Spacing.m,
    paddingBottom: 110,
  },
  header: {
    marginBottom: Spacing.l,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: Spacing.l,
  },
  welcomeRow: {
    flex: 1,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.s,
    marginTop: 4,
  },
  navBtn: {
    padding: 4,
  },
  headerAddBtnFixed: {
    position: "absolute",
    right: Spacing.l,
    width: 48,
    height: 48,
    borderRadius: Spacing.m,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  greeting: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  metricsGrid: {
    gap: Spacing.s,
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.s,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.m,
    borderRadius: Spacing.m,
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
    width: 34,
    height: 34,
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
    marginBottom: Spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
});
