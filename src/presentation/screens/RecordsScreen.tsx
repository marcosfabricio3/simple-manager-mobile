import { useToast } from "@/components/context/ToastContext";
import { validateRecord } from "@/src/application/validators/recordValidator";
import { Record } from "@/src/domain/entities/Record";
import { RecordCard } from "@/src/presentation/components/RecordCard";
import { useRecords } from "@/src/presentation/hooks/useRecords";
import { useState } from "react";
import {
    Button,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function RecordsScreen() {
  const { records, create, remove, update, existsByTitle } = useRecords();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<Record | null>(null);
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Manager</Text>

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

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordCard
            record={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
});
