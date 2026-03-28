import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { PaymentMethod } from "@/src/domain/entities/Appointment";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { useI18n } from "../translations/useI18n";

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod, details?: string) => void;
}

export function PaymentMethodModal({ visible, onClose, onConfirm }: Props) {
  const { darkMode } = useSettingsStore();
  const { t } = useI18n();
  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("cash");
  const [otherDetails, setOtherDetails] = useState("");

  const methods: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: "cash", label: t.appointments.method_cash, icon: "payments" },
    { id: "debit_credit", label: t.appointments.method_debit_credit, icon: "credit-card" },
    { id: "mercado_pago", label: t.appointments.method_mercado_pago, icon: "account-balance-wallet" },
    { id: "transfer", label: t.appointments.method_transfer, icon: "account-balance" },
    { id: "other", label: t.appointments.method_other, icon: "more-horiz" },
  ];

  const handleConfirm = () => {
    if (selectedMethod === "other" && !otherDetails.trim()) {
      return; // Could show an error
    }
    onConfirm(selectedMethod, selectedMethod === "other" ? otherDetails : undefined);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        
        <TouchableWithoutFeedback>
          <View style={[styles.content, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {t.appointments.selectPaymentMethod}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color={colors.subtext} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.methodList} showsVerticalScrollIndicator={false}>
              {methods.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodItem,
                    { borderColor: colors.border },
                    selectedMethod === method.id && { 
                      backgroundColor: colors.primary + "10",
                      borderColor: colors.primary 
                    }
                  ]}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <View style={styles.methodInfo}>
                    <MaterialIcons 
                      name={method.icon as any} 
                      size={22} 
                      color={selectedMethod === method.id ? colors.primary : colors.subtext} 
                    />
                    <Text style={[
                      styles.methodLabel, 
                      { color: colors.text },
                      selectedMethod === method.id && { color: colors.primary, fontWeight: "700" }
                    ]}>
                      {method.label}
                    </Text>
                  </View>
                  {selectedMethod === method.id && (
                    <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {selectedMethod === "other" && (
                <View style={styles.otherContainer}>
                  <TextInput
                    placeholder={t.appointments.method_other_placeholder}
                    placeholderTextColor={colors.subtext}
                    value={otherDetails}
                    onChangeText={setOtherDetails}
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: darkMode ? colors.secondaryBackground : "#FAFAFA",
                        color: colors.text,
                      },
                    ]}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmBtnText}>{t.common.confirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  methodList: {
    maxHeight: 400,
  },
  methodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
  },
  methodInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  otherContainer: {
    marginTop: 5,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
  },
  footer: {
    marginTop: 10,
  },
  confirmBtn: {
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  confirmBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
