import { useToast } from "@/components/context/ToastContext";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { validateRecord } from "@/src/application/validators/recordValidator";
import { Record } from "@/src/domain/entities/Record";
import { EmptyState } from "@/src/presentation/components/EmptyState";
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
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeTopPadding } from "@/src/presentation/hooks/useSafeTopPadding";
import { useI18n } from "@/src/presentation/translations/useI18n";

export default function RecordsScreen() {
  const { records, create, remove, update, existsByTitle } = useRecords();
  const { darkMode } = useSettingsStore();
  const { t } = useI18n();
  const tr = t.records;
  const paddingTop = useSafeTopPadding();

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<Record | null>(null);

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
        addToast(tr.existsError, "warning");
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

        addToast(tr.updateSuccess, "success");
        setEditing(null);
      } else {
        await create(cleanTitle, cleanType);
        addToast(tr.createSuccess, "success");
      }

      setTitle("");
      setType("");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Error",
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
      tr.deleteTitle,
      tr.deleteMsg,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.common.delete,
          onPress: () => handleDelete(id),
          style: "destructive",
        },
      ],
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      addToast(tr.deleteSuccess, "info");
    } catch (error) {
      addToast(
        error instanceof Error ? error.message : "Error",
        "error",
      );
    }
  };

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

    result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return result;
  }, [records, searchQuery, selectedType]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop,
        },
      ]}
    >
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        {tr.title}
      </Text>

      <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {editing ? tr.editRecord : tr.newRecord}
        </Text>
        <TextInput
          placeholder={tr.titlePlaceholder}
          placeholderTextColor={darkMode ? "#666" : "#A1A1AA"}
          value={title}
          onChangeText={setTitle}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: darkMode ? colors.secondaryBackground : "#fff",
              color: colors.text,
            },
          ]}
        />
        <TextInput
          placeholder={tr.typePlaceholder}
          placeholderTextColor={darkMode ? "#666" : "#A1A1AA"}
          value={type}
          onChangeText={setType}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: darkMode ? colors.secondaryBackground : "#fff",
              color: colors.text,
            },
          ]}
        />
        <Button
          title={editing ? tr.update : tr.save}
          onPress={handleSubmit}
        />
        {editing && (
          <View style={{ marginTop: 10 }}>
            <Button
              title={tr.cancel}
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

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {tr.filterSearch}
      </Text>
      <TextInput
        placeholder={tr.searchPlaceholder}
        placeholderTextColor={darkMode ? "#666" : "#8E8E93"}
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={[
          styles.searchInput,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
            color: colors.text,
          },
        ]}
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
                !selectedType && [
                  styles.filterChipActive,
                  { backgroundColor: colors.tint },
                ],
                darkMode && !selectedType && { backgroundColor: colors.tint },
                darkMode &&
                  selectedType && {
                    backgroundColor: colors.secondaryBackground,
                  },
              ]}
              onPress={() => setSelectedType(null)}
            >
              <Text
                style={[
                  styles.filterText,
                  !selectedType && styles.filterTextActive,
                  { color: !selectedType ? "#fff" : colors.text },
                ]}
              >
                {tr.filterAll}
              </Text>
            </TouchableOpacity>
            {uniqueTypes.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.filterChip,
                  selectedType === t && [
                    styles.filterChipActive,
                    { backgroundColor: colors.tint },
                  ],
                  darkMode &&
                    selectedType === t && { backgroundColor: colors.tint },
                  darkMode &&
                    selectedType !== t && {
                      backgroundColor: colors.secondaryBackground,
                    },
                ]}
                onPress={() => setSelectedType(t)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedType === t && styles.filterTextActive,
                    { color: selectedType === t ? "#fff" : colors.text },
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
          <View style={{ paddingTop: 40 }}>
            <EmptyState
              iconName="folder-open"
              title={tr.emptyTitle}
              description={tr.emptyDesc}
            />
          </View>
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
  },
  formContainer: {
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
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  searchInput: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 20,
    marginBottom: 10,
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
    fontSize: 14,
  },
  filterTextActive: {
    fontWeight: "bold",
  },
});
