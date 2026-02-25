// import { RecordService } from "@/src/application/services/RecordService";
// import { Record } from "@/src/domain/entities/Record";
// import { useEffect, useState } from "react";
// import { Button, FlatList, StyleSheet, Text, TextInput, View } from "react-native";

// export default function RecordsScreen() {
//   const service = new RecordService();

//   const [title, setTitle] = useState("");
//   const [type, setType] = useState("");
//   const [records, setRecords] = useState<Record[]>([]);

//   const loadRecords = async () => {
//     const data = await service.list();
//     setRecords(data);
//   };

//   const handleCreate = async () => {
//     if (!title || !type) return;

//     await service.create(title, type);

//     setTitle("");
//     setType("");

//     loadRecords();
//   };

//   const handleDelete = async (id: string) => {
//     await service.delete(id);
//     loadRecords();
//   }

//   useEffect(() => {
//     loadRecords();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Simple Manager</Text>

//       <TextInput
//         placeholder="Title"
//         value={title}
//         onChangeText={setTitle}
//         style={styles.input}
//       />

//       <TextInput
//         placeholder="Type"
//         value={type}
//         onChangeText={setType}
//         style={styles.input}
//       />

//       <Button title="Guardar" onPress={handleCreate} />

//       <FlatList
//         data={records}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.card}>
//             <Text style={styles.cardTitle}>{item.title}</Text>
//             <Text>Type: {item.type}</Text>

//             <Button
//               title="Eliminar"
//               onPress={() => handleDelete(item.id)}
//             />

//           </View>
//         )}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     marginTop: 40,
//   },
//   title: {
//     fontSize: 22,
//     fontWeight: "bold",
//     marginBottom: 20,
//   },
//   input: {
//     borderWidth: 1,
//     borderColor: "#ccc",
//     padding: 10,
//     marginBottom: 10,
//     borderRadius: 6,
//   },
//   card: {
//     padding: 15,
//     borderWidth: 1,
//     borderColor: "#eee",
//     borderRadius: 6,
//     marginTop: 10,
//   },
//   cardTitle: {
//     fontWeight: "bold",
//   },
// });

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

  const handleSubmit = async () => {
    if (!title || !type) return;
    if (editing) {
      await update({
        ...editing,
        title,
        type,
      });

      setEditing(null);
    } else {
      await create(title, type);
    }

    setTitle("");
    setType("");
  };

  const handleEdit = (record: Record) => {
    setEditing(record);
    setTitle(record.title);
    setType(record.type);
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
            onDelete={remove}
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