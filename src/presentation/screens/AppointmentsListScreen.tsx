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
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeTopPadding } from "@/src/presentation/hooks/useSafeTopPadding";
import {
  Calendar,
  CalendarProvider,
  DateData,
  Timeline,
  TimelineProps,
  TimelineEventProps,
  LocaleConfig
} from "react-native-calendars";

// Configure Locales
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy'
};
LocaleConfig.locales['en'] = {
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthNamesShort: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May.', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today'
};
import { format, addMinutes, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

export default function AppointmentsListScreen() {
  const { appointments, loadMonth, loading } = useMonthlyAppointments();
  const { darkMode, language } = useSettingsStore();
  const { t } = useI18n();
  const paddingTop = useSafeTopPadding();

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");

  useFocusEffect(
    useCallback(() => {
      // Update locale dynamically
      LocaleConfig.defaultLocale = language;
      loadMonth(currentYear, currentMonth, true);
    }, [currentYear, currentMonth, loadMonth, language]),
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
      textMonthFontWeight: "900" as const,
      textDayHeaderFontWeight: "700" as const,
      textDayFontSize: 18,
      textMonthFontSize: 24,
      textDayHeaderFontSize: 14,
      weekVerticalMargin: 20,
    }),
    [colors, darkMode],
  );

  const dailyAppointments = useMemo(() => {
    return appointments
      .filter((app) => app.date.split("T")[0] === selectedDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [appointments, selectedDate]);

  const timelineEvents = useMemo(() => {
    return appointments.map((app) => {
      const startDate = new Date(app.date);
      const endDate = addMinutes(startDate, app.durationMinutes);
      
      return {
        id: app.id,
        start: format(startDate, "yyyy-MM-dd HH:mm:ss"),
        end: format(endDate, "yyyy-MM-dd HH:mm:ss"),
        title: app.clientName,
        summary: app.services.map(s => s.name).join(", "),
        color: app.services[0]?.color || colors.primary,
        paymentStatus: app.paymentStatus,
        totalPrice: app.totalPrice
      };
    });
  }, [appointments, colors.primary]);

  const timelineDates = useMemo(() => {
    if (viewMode === "day") return selectedDate;
    
    // For week view (3 days), we provide an array of dates
    const dates = [];
    const baseDate = new Date(selectedDate + "T12:00:00");
    for (let i = 0; i < 3; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        dates.push(format(d, "yyyy-MM-dd"));
    }
    return dates;
  }, [selectedDate, viewMode]);

  return (
    <CalendarProvider
      date={selectedDate}
      onDateChanged={onDateChanged}
      onMonthChange={onMonthChange}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            paddingTop,
          },
        ]}
      >
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />

        <View style={styles.headerRow}>
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.text }]}>
              {t.calendar.title}
            </Text>
            {viewMode === "month" ? (
              <Text style={[styles.listSub, { color: colors.subtext, textTransform: 'none' }]}>
                {currentMonth.toString().padStart(2, '0')}/{currentYear}
              </Text>
            ) : (
              <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => setViewMode("month")}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Text style={[styles.listSub, { color: colors.subtext }]}>
                  {new Date(selectedDate + "T12:00:00").toLocaleDateString(
                    language === "es" ? "es-ES" : "en-US",
                    {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    },
                  )}
                </Text>
                <MaterialIcons 
                  name="calendar-today" 
                  size={14} 
                  color={colors.primary} 
                  style={{ marginLeft: 6, opacity: 0.8 }} 
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={[styles.toggleContainer, { backgroundColor: colors.secondaryBackground }]}>
            <TouchableOpacity 
              onPress={() => setViewMode("day")}
              style={[styles.toggleBtn, viewMode === "day" && { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }]}
            >
              <Text style={[styles.toggleText, { color: viewMode === "day" ? "white" : colors.subtext }]}>
                {language === "es" ? "Día" : "Day"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setViewMode("week")}
              style={[styles.toggleBtn, viewMode === "week" && { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }]}
            >
              <Text style={[styles.toggleText, { color: viewMode === "week" ? "white" : colors.subtext }]}>
                {language === "es" ? "Sem" : "Wk"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setViewMode("month")}
              style={[styles.toggleBtn, viewMode === "month" && { backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }]}
            >
              <Text style={[styles.toggleText, { color: viewMode === "month" ? "white" : colors.subtext }]}>
                {language === "es" ? "Mes" : "Mo"}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.headerAddBtnFixed, 
              { backgroundColor: colors.primary, marginLeft: 8 }
            ]}
            onPress={() =>
              router.push(`/appointments/create?date=${selectedDate}`)
            }
          >
            <MaterialIcons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentWrapper}>
          {viewMode === "month" ? (
            <View style={styles.fullscreenCalendar}>
              <Calendar
                key={`calendar-${theme}-${language}`}
                current={selectedDate}
                markedDates={markedDates}
                theme={{
                  ...calendarTheme,
                  weekVerticalMargin: 22,
                  'stylesheet.calendar.main': {
                    container: {
                      paddingLeft: 10,
                      paddingRight: 10,
                      backgroundColor: colors.background,
                      flex: 1,
                    },
                    week: {
                      marginVertical: 18,
                      flexDirection: 'row',
                      justifyContent: 'space-around'
                    }
                  },
                  'stylesheet.calendar.header': {
                    header: {
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingLeft: 10,
                      paddingRight: 10,
                      marginTop: 15,
                      marginBottom: 15,
                      alignItems: 'center'
                    },
                    monthText: {
                      fontSize: 26,
                      fontWeight: '900',
                      color: colors.text,
                      margin: 20
                    },
                    week: {
                      marginTop: 25,
                      marginBottom: 15,
                      flexDirection: 'row',
                      justifyContent: 'space-around'
                    }
                  }
                } as any}
                onMonthChange={(month: any) => {
                  onMonthChange(month);
                }}
                onDayPress={(day: DateData) => {
                  onDateChanged(day.dateString);
                  setViewMode("day");
                }}
                firstDay={1}
                enableSwipeMonths={true}
                renderHeader={(date: any) => {
                  const d = new Date(date);
                  const month = (d.getMonth() + 1).toString().padStart(2, '0');
                  const year = d.getFullYear();
                  return (
                    <Text style={{ 
                      fontSize: 26, 
                      fontWeight: '900', 
                      color: colors.text,
                      marginVertical: 10
                    }}>
                      {month}/{year}
                    </Text>
                  );
                }}
                style={{ flex: 1 }}
              />
            </View>
          ) : (
            <Timeline
              key={`timeline-${viewMode}-${selectedDate}`}
              events={timelineEvents as any}
              format24h={true}
              numberOfDays={viewMode === "week" ? 3 : 1}
              timelineLeftInset={72}
              rightEdgeSpacing={0}
              theme={{
                ...calendarTheme,
                eventTitle: { color: "white", fontWeight: "900", fontSize: 11 },
                eventSummary: { color: "white", opacity: 0.9, fontSize: 9, fontWeight: "600" },
                eventTimes: { color: "white", opacity: 0.8, fontSize: 9, fontWeight: "700" },
                timeLabel: { color: colors.subtext, fontSize: 12, fontWeight: "800", backgroundColor: colors.background, paddingRight: 8 },
                line: { left: 72, color: darkMode ? "#374151" : "#E5E7EB" },
                nowIndicatorColor: colors.primary,
              } as any}
              onEventPress={(event: any) => router.push(`/appointments/edit?id=${event.id}`)}
              start={7}
              end={23}
              date={timelineDates}
              renderEvent={(event: any) => (
                <View 
                  accessible={true}
                  accessibilityLabel={`${event.start.split(" ")[1].substring(0, 5)} - ${event.title}, ${event.summary}`}
                  accessibilityRole="button"
                  style={[
                    styles.customEvent, 
                    { backgroundColor: event.color, borderColor: event.color }
                  ]}
                >
                  <Text numberOfLines={1} style={styles.eventTitle}>
                    {event.title}
                  </Text>
                  
                  {viewMode === "day" && (
                    <Text numberOfLines={1} style={styles.eventSummary}>
                      {event.summary}
                    </Text>
                  )}

                  <View style={styles.eventFooter}>
                    <Text style={styles.eventTime}>
                      {viewMode === "day" ? `$${event.totalPrice} • ` : ""}{event.start.split(" ")[1].substring(0, 5)}
                    </Text>
                    {event.paymentStatus === "paid" && (
                      <View style={{ marginLeft: 4 }}>
                        <MaterialIcons name="check-circle" size={12} color="white" style={{ opacity: 0.9 }} />
                      </View>
                    )}
                  </View>
                </View>
              )}
              showNowIndicator
              scrollToFirst
              initialTime={{ hour: 8, minutes: 0 }}
            />
          )}
        </View>

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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  listHeader: {
    flex: 1,
    paddingVertical: 4,
  },
  headerAddBtnFixed: {
    padding: 10,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  listSub: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "capitalize",
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    alignItems: "center",
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 11,
    minWidth: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "800",
  },
  contentWrapper: {
    flex: 1,
    overflow: "hidden",
  },
  fullscreenCalendar: {
    flex: 1,
    paddingTop: 10,
  },
  statusBox: {
    flex: 1,
    paddingTop: 40,
    alignItems: "center",
  },
  customEvent: {
    flex: 1,
    borderRadius: 10,
    padding: 8,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 4,
  },
  eventTitle: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 2,
  },
  eventSummary: {
    color: "white",
    fontSize: 10,
    opacity: 0.9,
    fontWeight: "600",
    lineHeight: 12,
  },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 4,
  },
  eventTime: {
    color: "white",
    fontSize: 9,
    opacity: 0.85,
    fontWeight: "700",
  },
});
