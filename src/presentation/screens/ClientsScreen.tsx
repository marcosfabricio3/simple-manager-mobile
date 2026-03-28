import { useToast } from "@/components/context/ToastContext";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { Client } from "@/src/domain/entities/Client";
import { ClientProfileModal } from "@/src/presentation/components/ClientProfileModal";
import { EmptyState } from "@/src/presentation/components/EmptyState";
import { useClients } from "@/src/presentation/hooks/useClients";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { MaterialIcons } from "@expo/vector-icons";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
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
import { useSafeTopPadding } from "@/src/presentation/hooks/useSafeTopPadding";

export default function ClientsScreen() {
  const { clients, create, remove, update, load } = useClients();
  const { darkMode } = useSettingsStore();
  const { t } = useI18n();
  const paddingTop = useSafeTopPadding();

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "new" | "old">("all");
  const [selectedClientForProfile, setSelectedClientForProfile] =
    useState<Client | null>(null);

  const { addToast } = useToast();

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanNotes = notes.trim();

    if (!cleanName) {
      addToast(t.clients.nameRequired, "warning");
      return;
    }

    try {
      if (editing) {
        await update({
          ...editing,
          name: cleanName,
          phone: cleanPhone,
          notes: cleanNotes || undefined,
        });
        addToast(t.clients.updateSuccess, "success");
        setEditing(null);
      } else {
        await create(cleanName, cleanPhone, cleanNotes);
        addToast(t.clients.createSuccess, "success");

        // Guided Tour: Step 2 -> 3
        const { tutorialStep, updateSettings } = useSettingsStore.getState();
        if (tutorialStep === 2) {
          updateSettings({ tutorialStep: 3 });
          const { router } = require("expo-router");
          setTimeout(() => router.push("/(tabs)"), 1500);
        }
      }
      setName("");
      setPhone("");
      setNotes("");
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Error", "error");
    }
  };

  const handleEdit = (client: Client) => {
    setEditing(client);
    setName(client.name);
    setPhone(client.phone || "");
    setNotes(client.notes || "");
  };

  const confirmDelete = (id: string, clientName: string) => {
    Alert.alert(
      t.clients.deleteConfirmTitle,
      t.clients.deleteConfirmMsg,
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
      addToast(t.clients.deleteSuccess, "info");
    } catch (error) {
      addToast(t.clients.deleteError, "error");
    }
  };

  const filteredClients = useMemo(() => {
    let result = clients;
    
    if (filterMode === "new") result = result.filter(c => c.isNew);
    if (filterMode === "old") result = result.filter(c => !c.isNew);

    if (searchQuery.trim()) {
      result = result.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase().trim()),
      );
    }
    return result.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, searchQuery, filterMode]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop,
          },
        ]}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: colors.text }]}>
                {t.clients.title}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {clients.length}
                </Text>
              </View>
            </View>

            {useSettingsStore.getState().tutorialStep === 2 && (
              <View 
                style={[styles.tutorialBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
              >
                <MaterialIcons name="star" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tutorialTitle, { color: colors.primary }]}>{t.onboarding.stepClientTitle}</Text>
                  <Text style={[styles.tutorialDesc, { color: colors.text }]}>{t.onboarding.stepClientDesc}</Text>
                </View>
              </View>
            )}

            <View
              style={[
                styles.form,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionLabel, { color: colors.subtext }]}>
                {editing ? t.clients.editInfo : t.clients.newClient}
              </Text>

              <TextInput
                placeholder={t.clients.fullName}
                placeholderTextColor={colors.subtext + "80"}
                value={name}
                onChangeText={setName}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
              <TextInput
                placeholder={t.clients.phone}
                placeholderTextColor={colors.subtext + "80"}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
              <TextInput
                placeholder={t.clients.observations}
                placeholderTextColor={colors.subtext + "80"}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                style={[
                  styles.input,
                  styles.textArea,
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
                    {editing ? t.clients.saveChanges : t.clients.registerClient}
                  </Text>
                </TouchableOpacity>
                {editing && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditing(null);
                      setName("");
                      setPhone("");
                      setNotes("");
                    }}
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                  >
                    <Text
                      style={[styles.cancelBtnText, { color: colors.subtext }]}
                    >
                      {t.clients.cancel}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <MaterialIcons name="search" size={20} color={colors.subtext} />
              <TextInput
                placeholder={t.clients.searchPlaceholder}
                placeholderTextColor={colors.subtext + "80"}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: colors.text }]}
              />
            </View>

            <View style={styles.filterTabsContainer}>
              {(["all", "new", "old"] as const).map((mode) => {
                const isActive = filterMode === mode;
                let label = "";
                if (mode === "all") label = t.clients.filterAll;
                else if (mode === "new") label = t.clients.filterNew;
                else if (mode === "old") label = t.clients.filterOld;

                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setFilterMode(mode)}
                    activeOpacity={0.7}
                    style={[
                      styles.filterTab,
                      {
                        backgroundColor: isActive
                          ? colors.primary
                          : colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterTabText,
                        {
                          color: isActive ? "#fff" : colors.subtext,
                          fontWeight: isActive ? "700" : "500",
                        },
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            iconName="users"
            title={t.clients.emptyTitle}
            description={t.clients.emptyDesc}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.clientCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setSelectedClientForProfile(item)}
            activeOpacity={0.7}
          >
            <View style={styles.clientMain}>
              <View style={styles.nameRow}>
                <Text style={[styles.clientName, { color: colors.text }]}>
                  {item.name}
                </Text>
                {item.isNew && (
                  <View style={[styles.newBadge, { backgroundColor: colors.success + "20" }]}>
                    <Text style={[styles.newBadgeText, { color: colors.success }]}>
                      {t.clients.newClientBadge}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={14} color={colors.primary} />
                <Text style={[styles.phoneText, { color: colors.subtext }]}>
                  {item.phone || t.clients.noPhone}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                onPress={() => handleEdit(item)}
                style={styles.miniBtn}
              >
                <MaterialIcons name="edit" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => confirmDelete(item.id, item.name)}
                style={styles.miniBtn}
              >
                <MaterialIcons
                  name="delete-outline"
                  size={18}
                  color={colors.danger}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <ClientProfileModal
        client={selectedClientForProfile}
        visible={!!selectedClientForProfile}
        onClose={() => setSelectedClientForProfile(null)}
        onEditClient={(clientToEdit) => {
          setSelectedClientForProfile(null);
          setTimeout(() => handleEdit(clientToEdit), 300);
        }}
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
    paddingBottom: 120,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "700",
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    padding: 14,
    borderRadius: 10, // Guidelines: 10px
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "transparent",
  },
  textArea: {
    height: 60,
    textAlignVertical: "top",
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
  clientCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  clientMain: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  clientName: {
    fontSize: 17,
    fontWeight: "700",
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: "500",
  },
  cardActions: {
    flexDirection: "row",
    gap: 12,
  },
  miniBtn: {
    padding: 6,
  },
  filterTabsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 13,
  },
  tutorialBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 16,
  },
  tutorialTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  tutorialDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
});
