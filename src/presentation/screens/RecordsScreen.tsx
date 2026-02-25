import { useToast } from "@/components/context/ToastContext";
import { Record } from "@/src/domain/entities/Record";
import { RecordCard } from "@/src/presentation/components/RecordCard";
import { useRecords } from "@/src/presentation/hooks/useRecords";
import { useState } from "react";
import { Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";

export default function RecordsScreen() {
    const { records, create, remove, update } = useRecords();

    const [title, setTitle] = useState("");
    const [type, setType] = useState("");
    const [editing, setEditing] = useState<Record | null>(null);
    const { addToast } = useToast();

    const handleSubmit = async () => {
        if (!title || !type) {
            addToast("Todos los campos son obligatorios", "warning");
            return;
        };

        try {
            if (editing) {
                await update({
                    ...editing,
                    title,
                    type,
                });

                addToast("Registro actualizado correctamente", "success");
                setEditing(null);
            } else {
                await create(title, type);
                addToast("Registro creado correctamente", "success");
            }

            setTitle("");
            setType("");
        }
        catch (error) {
            addToast("Error al guardar el registro", "error");
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
        }
        catch {
            addToast("Error al eliminar el registro", "error");
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