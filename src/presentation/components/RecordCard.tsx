import { Record } from "@/src/domain/entities/Record";
import { Button, StyleSheet, Text, View } from "react-native";

interface Props {
    record: Record;
    onEdit: (record: Record) => void;
    onDelete: (id: string) => void;
}

export function RecordCard({ record, onEdit, onDelete }: Props) {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>{record.title}</Text>
            <Text>Type:{record.type}</Text>

            <Button title="Editar" onPress={() => onEdit(record)} />
            <Button title="Eliminar" onPress={() => onDelete(record.id)} />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 15,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#eee",
        marginTop: 10,
    },
    title: {
        fontWeight: "bold",
    },
});