import { useToast } from "@/components/context/ToastContext";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { Service } from "@/src/domain/entities/Service";
import { EmptyState } from "@/src/presentation/components/EmptyState";
import { ServiceCard } from "@/src/presentation/components/ServiceCard";
import { useServices } from "@/src/presentation/hooks/useServices";
import { useI18n } from "@/src/presentation/translations/useI18n";
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
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeTopPadding } from "@/src/presentation/hooks/useSafeTopPadding";

export default function ServicesScreen() {
  const { services, create, remove, update } = useServices();
  const { darkMode } = useSettingsStore();
  const { t } = useI18n();
  const paddingTop = useSafeTopPadding();

  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const PRESET_COLORS = [
    colors.primary,
    "#F43F5E", // Rose
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#3B82F6", // Blue
    "#64748B", // Slate
    "#EF4444", // Red
    "#F97316", // Orange
    "#84CC16", // Lime
    "#06B6D4", // Cyan
    "#0EA5E9", // Sky
    "#6366F1", // Indigo
    "#A855F7", // Purple
    "#D946EF", // Fuchsia
    "#71717A", // Zinc
    "#14B8A6", // Teal
    "#059669", // Green
    "#78350F", // Brown
  ];

  const [name, setName] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [editing, setEditing] = useState<Service | null>(null);

  const { addToast } = useToast();

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const cleanColor = color || colors.primary;
    const parsedPrice = parseFloat(defaultPrice);

    if (!cleanName) {
      addToast(t.services.nameRequired, "warning");
      return;
    }
    if (isNaN(parsedPrice)) {
      addToast(t.services.priceInvalid, "warning");
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
        addToast(t.services.updateSuccess, "success");
        setEditing(null);
      } else {
        await create(cleanName, parsedPrice, cleanColor);
        addToast(t.services.createSuccess, "success");
        
        // Guided Tour: Step 1 -> 2
        const { tutorialStep, updateSettings } = useSettingsStore.getState();
        if (tutorialStep === 1) {
          updateSettings({ tutorialStep: 2 });
          const { router } = require("expo-router");
          setTimeout(() => router.push("/(tabs)/clients"), 1500);
        }
      }
      setName("");
      setDefaultPrice("");
      setColor(PRESET_COLORS[0]);
    } catch (error) {
      addToast(t.common.error, "error");
    }
  };

  const handleEdit = (service: Service) => {
    setEditing(service);
    setName(service.name);
    setDefaultPrice(service.defaultPrice.toString());
    setColor(service.color);
  };

  const confirmDelete = (id: string) => {
    Alert.alert(t.services.deleteConfirmTitle, t.services.deleteConfirmMsg, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        onPress: () => handleDelete(id),
        style: "destructive",
      },
    ]);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      addToast(t.services.deleteSuccess, "info");
    } catch (error) {
      addToast(t.services.deleteError, "error");
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
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop,
          },
        ]}
        ListHeaderComponent={
          <>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t.services.title}
            </Text>

            {useSettingsStore.getState().tutorialStep === 1 && (
              <View 
                style={[styles.tutorialBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
              >
                <MaterialIcons name="star" size={24} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tutorialTitle, { color: colors.primary }]}>{t.onboarding.stepServiceTitle}</Text>
                  <Text style={[styles.tutorialDesc, { color: colors.text }]}>{t.onboarding.stepServiceDesc}</Text>
                </View>
              </View>
            )}

            <View
              style={[
                styles.form,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.label, { color: colors.subtext }]}>
                {editing ? t.services.editService : t.services.newService}
              </Text>

              <TextInput
                placeholder={t.services.namePlaceholder}
                placeholderTextColor={colors.subtext + "80"}
                value={name}
                onChangeText={setName}
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />
              <TextInput
                placeholder={t.services.pricePlaceholder}
                placeholderTextColor={colors.subtext + "80"}
                value={defaultPrice}
                onChangeText={setDefaultPrice}
                keyboardType="numeric"
                style={[
                  styles.input,
                  { borderColor: colors.border, color: colors.text },
                ]}
              />

              <Text
                style={[
                  styles.label,
                  { color: colors.subtext, marginTop: 8, marginBottom: 12 },
                ]}
              >
                {t.services.colorLabel}
              </Text>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c },
                      color === c && {
                        borderColor: colors.text,
                        borderWidth: 3,
                        transform: [{ scale: 1.1 }],
                      },
                    ]}
                  />
                ))}
              </View>

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
                    {editing ? t.services.saveChanges : t.services.addService}
                  </Text>
                </TouchableOpacity>
                {editing && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditing(null);
                      setName("");
                      setDefaultPrice("");
                      setColor(PRESET_COLORS[0]);
                    }}
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                  >
                    <Text
                      style={[styles.cancelBtnText, { color: colors.subtext }]}
                    >
                      {t.services.cancel}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            iconName="list"
            title={t.services.emptyTitle}
            description={t.services.emptyDesc}
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
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "transparent",
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
