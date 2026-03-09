import CreateAppointmentScreen from "@/src/presentation/screens/CreateAppointmentScreen";
import { Stack } from "expo-router";

export default function CreateAppointmentRoute() {
  return (
    <>
      <Stack.Screen
        options={{ title: "Nuevo Turno", headerBackTitle: "Atrás" }}
      />
      <CreateAppointmentScreen />
    </>
  );
}
