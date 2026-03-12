import { useToast } from "@/components/context/ToastContext";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { Service } from "@/src/domain/entities/Service";
import { EmptyState } from "@/src/presentation/components/EmptyState";
import { ServiceCard } from "@/src/presentation/components/ServiceCard";
import { useServices } from "@/src/presentation/hooks/useServices";
import { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ServicesScreen() {
  const { services, create, remove, update } = useServices();
  const { darkMode } = useSettingsStore();

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const [name, setName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [color, setColor] = useState("");
  const [editing, setEditing] = useState<Service | null>(null);

  const { addToast } = useToast();

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const cleanColor = color.trim() || colors.primary;
    const parsedPrice = parseFloat(defaultPrice);

    if (!cleanName) {
      addToast("El nombre es obligatorio", "warning");
      return;
    }
    if (isNaN(parsedPrice)) {
      addToast("El precio debe ser un número", "warning");
      return;
    }

    try {
      if (editing) {
        await update({
          ...editing,
          name: cleanName,
          defaultPrice: parsedPrice,
          color: cleanColor,
        });
        addToast("Servicio actualizado", "success");
        setEditing(null);
      } else {
        await create(cleanName, parsedPrice, cleanColor);
        addToast("Servicio creado", "success");
      }
      setName("");
      setDefaultPrice("");
      setColor("");
    } catch (error) {
      addToast("Error al guardar", "error");
    }
  };

  const handleEdit = (service: Service) => {
    setEditing(service);
    setName(service.name);
    setDefaultPrice(service.defaultPrice.toString());
    setColor(service.color);
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Borrar servicio", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        onPress: () => handleDelete(id),
        style: "destructive",
      },
    ]);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      addToast("Servicio eliminado", "info");
    } catch (error) {
      addToast("Error al eliminar", "error");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Servicios
            </Text>

            <View
              style={[
                styles.form,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.label, { color: colors.subtext }]}>
                {editing ? "Editar Servicio" : "Nuevo Servicio"}
              </Text>

              <TextInput
                placeholder="Nombre del tratamiento"
                placeholderTextColor={colors.subtext + "80"}
                value={name}
                onChangeText={setName}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
              <TextInput
                placeholder="Precio base ($)"
                placeholderTextColor={colors.subtext + "80"}
                value={defaultPrice}
                onChangeText={setDefaultPrice}
                keyboardType="numeric"
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
              <TextInput
                placeholder="Color Hex (ej: #FF0000)"
                placeholderTextColor={colors.subtext + "80"}
                value={color}
                onChangeText={setColor}
                autoCapitalize="none"
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />

              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.submitBtn,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={handleSubmit}
                >
                  <Text style={styles.submitBtnText}>
                    {editing ? "Guardar" : "Añadir Servicio"}
                  </Text>
                </TouchableOpacity>
                {editing && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditing(null);
                      setName("");
                      setDefaultPrice("");
                      setColor("");
                    }}
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                  >
                    <Text
                      style={[styles.cancelBtnText, { color: colors.subtext }]}
                    >
                      Anular
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            iconName="list-alt"
            title="Sin registros"
            description="Añade los servicios que ofreces en tu clínica."
          />
        }
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            onEdit={handleEdit}
            onDelete={confirmDelete}
          />
        )}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  form: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  submitBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 15,
  },
  cancelBtn: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    fontWeight: "700",
    fontSize: 15,
  },
});
