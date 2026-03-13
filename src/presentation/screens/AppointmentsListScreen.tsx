import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { AppointmentCard } from "@/src/presentation/components/AppointmentCard";
import { EmptyState } from "@/src/presentation/components/EmptyState";
import { useMonthlyAppointments } from "@/src/presentation/hooks/useMonthlyAppointments";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, CalendarProvider, DateData } from "react-native-calendars";

export default function AppointmentsListScreen() {
  const { appointments, loadMonth, loading } = useMonthlyAppointments();
  const { darkMode, language } = useSettingsStore();
  const { t } = useI18n();

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  useFocusEffect(
    useCallback(() => {
      loadMonth(currentYear, currentMonth, true);
    }, [currentYear, currentMonth, loadMonth]),
  );

  const onMonthChange = useCallback(
    (date: { year: number; month: number }) => {
      setCurrentYear(date.year);
      setCurrentMonth(date.month);
      loadMonth(date.year, date.month);
    },
    [loadMonth],
  );

  const onDateChanged = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    appointments.forEach((app) => {
      const dateKey = app.date.split("T")[0];
      marks[dateKey] = { marked: true, dotColor: colors.secondary };
    });
    // Highlight selected date
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: colors.primary,
    };
    return marks;
  }, [appointments, selectedDate, colors]);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: colors.background,
      calendarBackground: colors.background,
      textSectionTitleColor: colors.subtext,
      selectedDayBackgroundColor: colors.primary,
      selectedDayTextColor: "#ffffff",
      todayTextColor: colors.primary,
      dayTextColor: colors.text,
      textDisabledColor: darkMode ? "#374151" : "#E5E7EB",
      dotColor: colors.secondary,
      selectedDotColor: "#ffffff",
      arrowColor: colors.primary,
      monthTextColor: colors.text,
      indicatorColor: colors.primary,
      textDayFontWeight: "600" as const,
      textMonthFontWeight: "800" as const,
      textDayHeaderFontWeight: "600" as const,
      textDayFontSize: 14,
      textMonthFontSize: 18,
      textDayHeaderFontSize: 12,
    }),
    [colors, darkMode],
  );

  const dailyAppointments = useMemo(() => {
    return appointments
      .filter((app) => app.date.split("T")[0] === selectedDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [appointments, selectedDate]);

  return (
    <CalendarProvider
      date={selectedDate}
      onDateChanged={onDateChanged}
      onMonthChange={onMonthChange}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />

        <View style={styles.calendarContainer}>
          <Calendar
            key={`calendar-${theme}`}
            current={selectedDate}
            markedDates={markedDates}
            theme={calendarTheme}
            onDayPress={(day: DateData) => onDateChanged(day.dateString)}
            firstDay={1}
            enableSwipeMonths={true}
          />
        </View>

        <View style={styles.listHeader}>
          <Text style={[styles.listTitle, { color: colors.text }]}>
            {t.calendar.title}
          </Text>
          <Text style={[styles.listSub, { color: colors.subtext }]}>
            {new Date(selectedDate + "T12:00:00").toLocaleDateString(
              language === "es" ? "es-ES" : "en-US",
              {
                weekday: "long",
                day: "numeric",
                month: "long",
              },
            )}
          </Text>
        </View>

        <FlatList
          data={dailyAppointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemPadding}>
              <AppointmentCard
                appointment={item}
                concise={true}
                onEdit={(id) => router.push(`/appointments/edit?id=${id}`)}
                onDelete={() => loadMonth(currentYear, currentMonth, true)}
              />
            </View>
          )}
          ListEmptyComponent={
            loading ? (
              <View style={styles.statusBox}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <EmptyState
                iconName="event-busy"
                title={t.calendar.freeDay}
                description={t.calendar.noAppointments}
              />
            )
          }
          contentContainerStyle={styles.listContent}
        />

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() =>
            router.push(`/appointments/create?date=${selectedDate}`)
          }
        >
          <MaterialIcons name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </CalendarProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  calendarContainer: {
    paddingBottom: 8,
    backgroundColor: "transparent",
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  listSub: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
    marginTop: 2,
  },
  listContent: {
    paddingBottom: 100,
  },
  itemPadding: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  statusBox: {
    flex: 1,
    paddingTop: 40,
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 94,
    right: 24,
    width: 56, // Guidelines: 56px
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
