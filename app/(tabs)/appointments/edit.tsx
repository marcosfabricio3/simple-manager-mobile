import EditAppointmentScreen from "@/src/presentation/screens/EditAppointmentScreen";
import { Stack } from "expo-router";

export default function EditAppointmentRoute() {
  return (
    <>
      <Stack.Screen
        options={{ title: "Editar Turno", headerBackTitle: "Atrás" }}
      />
      <EditAppointmentScreen />
    </>
  );
}
