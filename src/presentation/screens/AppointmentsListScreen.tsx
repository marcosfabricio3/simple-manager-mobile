import { AppointmentWithDetails } from "@/src/domain/entities/Appointment";
import { AppointmentCard } from "@/src/presentation/components/AppointmentCard";
import { useMonthlyAppointments } from "@/src/presentation/hooks/useMonthlyAppointments";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AgendaList,
  CalendarProvider,
  ExpandableCalendar,
} from "react-native-calendars";

export default function AppointmentsListScreen() {
  const { appointments, loadMonth, loading } = useMonthlyAppointments();

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  useFocusEffect(
    useCallback(() => {
      loadMonth(currentYear, currentMonth);
    }, [currentYear, currentMonth, loadMonth]),
  );

  const onMonthChange = useCallback(
    (date: any) => {
      setCurrentYear(date.year);
      setCurrentMonth(date.month);
      loadMonth(date.year, date.month);
    },
    [loadMonth],
  );

  const onDateChanged = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const agendaSections = useMemo(() => {
    const sectionsMap: { [key: string]: any[] } = {};

    // Safety: ensure selectedDate is ALWAYS in sections to avoid SectionList index errors
    const focusDate = selectedDate || todayStr;
    sectionsMap[focusDate] = [];

    appointments.forEach((app) => {
      const dateKey = app.date.split("T")[0];
      if (!sectionsMap[dateKey]) sectionsMap[dateKey] = [];
      sectionsMap[dateKey].push(app);
    });

    return Object.keys(sectionsMap)
      .sort()
      .map((date) => ({
        title: date,
        data: sectionsMap[date],
      }));
  }, [appointments, selectedDate, todayStr]);

  const markedDates = useMemo(() => {
    const marks: any = {};
    appointments.forEach((app) => {
      const dateKey = app.date.split("T")[0];
      marks[dateKey] = { marked: true, dotColor: "#FF9500" };
    });
    return marks;
  }, [appointments]);

  const renderItem = useCallback(
    ({ item }: any) => {
      return (
        <View style={styles.itemContainer}>
          <AppointmentCard
            appointment={item as AppointmentWithDetails}
            onDelete={() => loadMonth(currentYear, currentMonth, true)}
          />
        </View>
      );
    },
    [loadMonth, currentYear, currentMonth],
  );

  return (
    <CalendarProvider
      date={selectedDate}
      onDateChanged={onDateChanged}
      onMonthChange={onMonthChange}
      showTodayButton
      theme={{
        todayButtonTextColor: "#007AFF",
      }}
    >
      <View style={styles.container}>
        <ExpandableCalendar
          firstDay={1}
          markedDates={markedDates}
          theme={calendarTheme}
          disableAllTouchEventsForDisabledDays
        />

        <View style={{ flex: 1 }}>
          {loading &&
          agendaSections.length === 1 &&
          agendaSections[0].data.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Cargando turnos...</Text>
            </View>
          ) : (
            <AgendaList
              key={`agenda-list-${agendaSections.length}`}
              sections={agendaSections}
              renderItem={renderItem}
              sectionStyle={styles.sectionHeader}
              dayFormatter={(date) => {
                const d = new Date(date);
                return d.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                });
              }}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.fab}
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

const calendarTheme = {
  selectedDayBackgroundColor: "#007AFF",
  selectedDayTextColor: "#ffffff",
  todayTextColor: "#007AFF",
  dayTextColor: "#2d4150",
  textDisabledColor: "#d9e1e8",
  dotColor: "#FF9500",
  selectedDotColor: "#ffffff",
  arrowColor: "#007AFF",
  monthTextColor: "#007AFF",
  indicatorColor: "#007AFF",
  textDayFontWeight: "300" as const,
  textMonthFontWeight: "bold" as const,
  textDayHeaderFontWeight: "300" as const,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  sectionHeader: {
    backgroundColor: "#F2F2F7",
    color: "#8E8E93",
    padding: 10,
    textTransform: "capitalize",
  },
  itemContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#8E8E93",
    fontSize: 16,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
