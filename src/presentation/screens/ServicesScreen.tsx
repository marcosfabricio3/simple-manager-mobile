import { useToast } from "@/components/context/ToastContext";
import { Service } from "@/src/domain/entities/Service";
import { ServiceCard } from "@/src/presentation/components/ServiceCard";
import { useServices } from "@/src/presentation/hooks/useServices";
import { useState } from "react";
import {
    Alert,
    Button,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function ServicesScreen() {
  const { services, create, remove, update, existsByName } = useServices();

  const [name, setName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [color, setColor] = useState("");
  const [editing, setEditing] = useState<Service | null>(null);

  const { addToast } = useToast();

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const cleanColor = color.trim() || "#007AFF";
    const parsedPrice = parseFloat(defaultPrice);

    if (!cleanName) {
      addToast("El nombre del servicio es obligatorio", "warning");
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      addToast("El precio debe ser un número válido mayor a 0", "warning");
      return;
    }

    if (!editing) {
      const exists = await existsByName(cleanName);
      if (exists) {
        addToast("Ya existe un servicio con ese nombre", "warning");
        return;
      }
    }

    try {
      if (editing) {
        await update({
          ...editing,
          name: cleanName,
          defaultPrice: parsedPrice,
          color: cleanColor,
        });
        addToast("Servicio actualizado correctamente", "success");
        setEditing(null);
      } else {
        await create(cleanName, parsedPrice, cleanColor);
        addToast("Servicio creado correctamente", "success");
      }

      setName("");
      setDefaultPrice("");
      setColor("");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Error inesperado",
        "error",
      );
    }
  };

  const handleEdit = (service: Service) => {
    setEditing(service);
    setName(service.name);
    setDefaultPrice(service.defaultPrice.toString());
    setColor(service.color);
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Eliminar servicio",
      "¿Estás seguro de que quieres eliminar este servicio? No aparecerá para nuevos turnos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          onPress: () => handleDelete(id),
          style: "destructive",
        },
      ],
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      addToast("Servicio eliminado correctamente", "info");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Error inesperado",
        "error",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>
          {editing ? "Editar Servicio" : "Nuevo Servicio"}
        </Text>
        <TextInput
          placeholder="Nombre del servicio (Ej: Consulta 1hr)"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Precio por defecto (Ej: 1500)"
          value={defaultPrice}
          onChangeText={setDefaultPrice}
          keyboardType="numeric"
          style={styles.input}
        />
        <TextInput
          placeholder="Color Hexadecimal (Ej: #FF0000) Opcional"
          value={color}
          onChangeText={setColor}
          autoCapitalize="none"
          style={styles.input}
        />
        <Button
          title={editing ? "Actualizar" : "Guardar Servicio"}
          onPress={handleSubmit}
        />
        {editing && (
          <View style={{ marginTop: 10 }}>
            <Button
              title="Cancelar Edición"
              color="red"
              onPress={() => {
                setEditing(null);
                setName("");
                setDefaultPrice("");
                setColor("");
              }}
            />
          </View>
        )}
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay servicios registrados.</Text>
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
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  formContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
    fontSize: 16,
  },
});
