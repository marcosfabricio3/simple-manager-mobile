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
import { MaterialIcons } from "@expo/vector-icons";
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
        error instanceof Error ? error.message : t.common.error,
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
        error instanceof Error ? error.message : t.common.error,
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

      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {tr.title}
        </Text>
      </View>

      <View style={[styles.formContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.subtext }]}>
          {editing ? tr.editRecord : tr.newRecord}
        </Text>
        <TextInput
          placeholder={tr.titlePlaceholder}
          placeholderTextColor={colors.subtext + "80"}
          value={title}
          onChangeText={setTitle}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
        <TextInput
          placeholder={tr.typePlaceholder}
          placeholderTextColor={colors.subtext + "80"}
          value={type}
          onChangeText={setType}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
        />
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
        >
          <Text style={styles.submitBtnText}>
            {editing ? tr.update : tr.save}
          </Text>
        </TouchableOpacity>

        {editing && (
          <TouchableOpacity
            onPress={() => {
              setEditing(null);
              setTitle("");
              setType("");
            }}
            style={[styles.cancelBtn, { borderColor: colors.border, marginTop: 10 }]}
          >
            <Text style={[styles.cancelBtnText, { color: colors.subtext }]}>
              {tr.cancel}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.subtext, marginTop: 10 }]}>
        {tr.filterSearch}
      </Text>
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <MaterialIcons name="search" size={20} color={colors.subtext} />
        <TextInput
          placeholder={tr.searchPlaceholder}
          placeholderTextColor={colors.subtext + "80"}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

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
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  formContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
  submitBtn: {
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
  },
  cancelBtnText: {
    fontWeight: "700",
    fontSize: 15,
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
