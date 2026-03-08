import { useToast } from "@/components/context/ToastContext";
import { validateRecord } from "@/src/application/validators/recordValidator";
import { Record } from "@/src/domain/entities/Record";
import { RecordCard } from "@/src/presentation/components/RecordCard";
import { useRecords } from "@/src/presentation/hooks/useRecords";
import { useMemo, useState } from "react";
import {
    Alert,
    Button,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function RecordsScreen() {
  const { records, create, remove, update, existsByTitle } = useRecords();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<Record | null>(null);

  // New States for Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { addToast } = useToast();

  const handleSubmit = async () => {
    const result = validateRecord(title, type);
    if (!result.valid) {
      addToast(result.message!, "warning");
      return;
    }

    const cleanTitle = title.trim();
    const cleanType = type.trim();

    if (!editing) {
      const exists = await existsByTitle(cleanTitle);
      if (exists) {
        addToast("Ya existe un registro con ese titulo", "warning");
        return;
      }
    }

    try {
      if (editing) {
        await update({
          ...editing,
          title: cleanTitle,
          type: cleanType,
        });

        addToast("Registro actualizado correctamente", "success");
        setEditing(null);
      } else {
        await create(cleanTitle, cleanType);
        addToast("Registro creado correctamente", "success");
      }

      setTitle("");
      setType("");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Error inesperado",
        "error",
      );
    }
  };

  const handleEdit = (record: Record) => {
    setEditing(record);
    setTitle(record.title);
    setType(record.type);
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Eliminar registro",
      "¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer.",
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
      addToast("Registro eliminado correctamente", "info");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Error inesperado",
        "error",
      );
    }
  };

  // Derived data
  const uniqueTypes = useMemo(() => {
    const types = new Set(records.map((r) => r.type));
    return Array.from(types).sort();
  }, [records]);

  const filteredRecords = useMemo(() => {
    let result = records;
    if (searchQuery.trim()) {
      result = result.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase().trim()),
      );
    }
    if (selectedType) {
      result = result.filter((r) => r.type === selectedType);
    }

    // Sort by creation date descending
    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return result;
  }, [records, searchQuery, selectedType]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <Text style={styles.headerTitle}>Simple Manager</Text>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>
          {editing ? "Editar Registro" : "Nuevo Registro"}
        </Text>
        <TextInput
          placeholder="Title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        <TextInput
          placeholder="Type"
          value={type}
          onChangeText={setType}
          style={styles.input}
        />
        <Button
          title={editing ? "Actualizar" : "Guardar"}
          onPress={handleSubmit}
        />
        {editing && (
          <View style={{ marginTop: 10 }}>
            <Button
              title="Cancelar Edición"
              color="red"
              onPress={() => {
                setEditing(null);
                setTitle("");
                setType("");
              }}
            />
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Filtrar y Buscar</Text>
      <TextInput
        placeholder="Buscar por título..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />

      {uniqueTypes.length > 0 && (
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersContainer}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                !selectedType && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(null)}
            >
              <Text
                style={[
                  styles.filterText,
                  !selectedType && styles.filterTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>
            {uniqueTypes.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.filterChip,
                  selectedType === t && styles.filterChipActive,
                ]}
                onPress={() => setSelectedType(t)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedType === t && styles.filterTextActive,
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se encontraron registros.</Text>
        }
        renderItem={({ item }) => (
          <RecordCard
            record={item}
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
    marginTop: 40,
    backgroundColor: "#f9f9f9",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
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
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    borderRadius: 20,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  filtersContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: "#007AFF",
  },
  filterText: {
    color: "#333",
    fontSize: 14,
  },
  filterTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: 20,
    fontSize: 16,
  },
});
