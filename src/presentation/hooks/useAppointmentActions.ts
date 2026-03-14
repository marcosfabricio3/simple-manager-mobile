import { AppointmentWithDetails } from "../../domain/entities/Appointment";
import { AppointmentService } from "@/src/application/services/AppointmentService";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { useMemo } from "react";
import { Alert, LayoutAnimation } from "react-native";

export function useAppointmentActions() {
  const service = useMemo(() => new AppointmentService(), []);
  const { t } = useI18n();

  const deleteAppointmentWithPrompt = (id: string, onRefresh?: () => void) => {
    Alert.alert(
      t.appointments.deletePromptTitle,
      t.appointments.deletePromptMsg,
      [
        { text: t.appointments.back, style: "cancel" },
        {
          text: t.appointments.clientCancelled,
          onPress: async () => {
            try {
              await service.updateStatus(id, "cancelled");
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              if (onRefresh) onRefresh();
            } catch (e) {
              console.error(e);
            }
          },
        },
        {
          text: t.appointments.deleteRecord,
          onPress: async () => {
            try {
              await service.delete(id);
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              if (onRefresh) onRefresh();
            } catch (e) {
              console.error(e);
            }
          },
          style: "destructive",
        },
      ],
    );
  };

  const togglePaymentStatus = async (appointment: AppointmentWithDetails, onRefresh?: () => void) => {
    const newStatus = appointment.paymentStatus === "paid" ? "unpaid" : "paid";
    try {
      await service.updatePaymentStatus(appointment.id, newStatus);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return {
    deleteAppointmentWithPrompt,
    togglePaymentStatus,
  };
};
