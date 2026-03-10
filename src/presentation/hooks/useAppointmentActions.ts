import { AppointmentService } from "@/src/application/services/AppointmentService";
import { useMemo } from "react";
import { Alert } from "react-native";

export function useAppointmentActions() {
  const service = useMemo(() => new AppointmentService(), []);

  const deleteAppointmentWithPrompt = (id: string, onRefresh?: () => void) => {
    Alert.alert(
      "Cancelar o Eliminar",
      "¿El paciente canceló el turno o deseas eliminar el registro por error?",
      [
        { text: "Volver", style: "cancel" },
        {
          text: "Canceló el Cliente",
          onPress: async () => {
            try {
              await service.updateStatus(id, "cancelled");
              if (onRefresh) onRefresh();
            } catch (e) {
              console.error(e);
            }
          },
        },
        {
          text: "Eliminar Registro",
          onPress: async () => {
            try {
              await service.delete(id);
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

  return {
    deleteAppointmentWithPrompt,
  };
}
