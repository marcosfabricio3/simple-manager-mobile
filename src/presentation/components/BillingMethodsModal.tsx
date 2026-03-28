import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Pressable,
} from "react-native";

interface BillingMethodsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BillingMethodsModal({ visible, onClose }: BillingMethodsModalProps) {
  const { darkMode, freeBillingPaymentMethods, updateSettings } = useSettingsStore();
  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];
  const { t } = useI18n();

  const allMethods = [
    { id: "cash", label: t.appointments.method_cash },
    { id: "debit_credit", label: t.appointments.method_debit_credit },
    { id: "mercado_pago", label: t.appointments.method_mercado_pago },
    { id: "transfer", label: t.appointments.method_transfer },
    { id: "other", label: t.appointments.method_other },
  ];

  const toggleMethod = (methodId: string) => {
    const isSelected = freeBillingPaymentMethods.includes(methodId);
    const newList = isSelected
      ? freeBillingPaymentMethods.filter((id) => id !== methodId)
      : [...freeBillingPaymentMethods, methodId];
    updateSettings({ freeBillingPaymentMethods: newList });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t.settings.selectBillingMethods}
            </Text>
            <Text style={[styles.subtitle, { color: colors.subtext }]}>
              {t.settings.billingMethodDesc}
            </Text>
          </View>

          <ScrollView style={styles.methodsList} showsVerticalScrollIndicator={false}>
            {allMethods.map((method) => {
              const isSelected = freeBillingPaymentMethods.includes(method.id);
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodItem,
                    { borderBottomColor: colors.border + "40" }
                  ]}
                  onPress={() => toggleMethod(method.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.methodLabel, { color: colors.text }]}>
                    {method.label}
                  </Text>
                  <View 
                    style={[
                      styles.checkbox, 
                      { 
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary : "transparent" 
                      }
                    ]}
                  >
                    {isSelected && (
                      <MaterialIcons name="check" size={18} color="#FFF" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>{t.common.confirm}</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  methodsList: {
    marginBottom: 20,
  },
  methodItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
