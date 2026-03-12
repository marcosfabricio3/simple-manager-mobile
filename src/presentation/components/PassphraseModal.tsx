/**
 * PassphraseModal — Secure passphrase input for backup operations.
 *
 * Used in two modes:
 *   "export" — shows two inputs (new passphrase + confirm) with strength indicator
 *   "import" — shows one input (enter the backup passphrase)
 */
import { Colors } from "@/constants/theme";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface PassphraseModalProps {
  visible: boolean;
  mode: "export" | "import";
  loading?: boolean;
  onConfirm: (passphrase: string) => void;
  onCancel: () => void;
}

type StrengthLevel = {
  label: string;
  color: string;
  width: string;
};

function getStrength(
  p: string,
  tb: typeof import("@/src/presentation/translations/translations").translations.es.backup,
): StrengthLevel {
  if (p.length === 0) return { label: "", color: "transparent", width: "0%" };
  if (p.length < 6)
    return { label: tb.strengthVeryWeak, color: "#FF3B30", width: "20%" };
  if (p.length < 10)
    return { label: tb.strengthWeak, color: "#FF9500", width: "40%" };
  if (p.length < 14)
    return { label: tb.strengthFair, color: "#FFCC00", width: "60%" };
  if (p.length < 20)
    return { label: tb.strengthStrong, color: "#34C759", width: "80%" };
  return { label: tb.strengthVeryStrong, color: "#007AFF", width: "100%" };
}

export function PassphraseModal({
  visible,
  mode,
  loading = false,
  onConfirm,
  onCancel,
}: PassphraseModalProps) {
  const { t, language } = useI18n();
  const colors = Colors[language === "es" ? "light" : "light"]; // honours theme via useSettingsStore inside useI18n

  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setPassphrase("");
      setConfirm("");
      setError("");
      setShowPass(false);
    }
  }, [visible]);

  const strength = getStrength(passphrase, t.backup);
  const isExport = mode === "export";

  const title = isExport ? t.backup.exportTitle : t.backup.importTitle;
  const subtitle = isExport ? t.backup.exportSubtitle : t.backup.importSubtitle;

  const handleConfirm = () => {
    setError("");

    if (passphrase.length < 6) {
      setError(t.backup.passwordTooShort);
      return;
    }

    if (isExport && passphrase !== confirm) {
      setError(t.backup.passwordMismatch);
      return;
    }

    onConfirm(passphrase);
  };

  // Use a neutral mid-tone that works on both themes for the backdrop
  const cardBg = "#FFFFFF";
  const textColor = "#1F2937";
  const subtextColor = "#6B7280";
  const borderColor = "#E5E7EB";
  const bgColor = "#F7F9FC";
  const primaryColor = "#7C9CF5";
  const warningColor = "#FF9500";
  const dangerColor = "#FF3B30";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: primaryColor + "18" },
              ]}
            >
              <MaterialIcons name="lock" size={24} color={primaryColor} />
            </View>
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: subtextColor }]}>
              {subtitle}
            </Text>
          </View>

          {/* Passphrase input */}
          <View
            style={[styles.inputRow, { borderColor, backgroundColor: bgColor }]}
          >
            <MaterialIcons
              name="vpn-key"
              size={18}
              color={subtextColor}
              style={{ marginLeft: 12 }}
            />
            <TextInput
              style={[styles.input, { color: textColor }]}
              placeholder={isExport ? t.backup.newPassword : t.backup.password}
              placeholderTextColor={subtextColor}
              secureTextEntry={!showPass}
              value={passphrase}
              onChangeText={setPassphrase}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPass((v) => !v)}
              style={{ padding: 12 }}
            >
              <MaterialIcons
                name={showPass ? "visibility-off" : "visibility"}
                size={18}
                color={subtextColor}
              />
            </TouchableOpacity>
          </View>

          {/* Strength bar (export only) */}
          {isExport && passphrase.length > 0 && (
            <View style={styles.strengthWrap}>
              <View
                style={[styles.strengthBar, { backgroundColor: borderColor }]}
              >
                <View
                  style={[
                    styles.strengthFill,
                    {
                      backgroundColor: strength.color,
                      width: strength.width as any,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          {/* Confirm input (export only) */}
          {isExport && (
            <View
              style={[
                styles.inputRow,
                { borderColor, backgroundColor: bgColor, marginTop: 10 },
              ]}
            >
              <MaterialIcons
                name="vpn-key"
                size={18}
                color={subtextColor}
                style={{ marginLeft: 12 }}
              />
              <TextInput
                style={[styles.input, { color: textColor }]}
                placeholder={t.backup.confirmPassword}
                placeholderTextColor={subtextColor}
                secureTextEntry={!showPass}
                value={confirm}
                onChangeText={setConfirm}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
          )}

          {/* Password-loss warning (export only) */}
          {isExport && (
            <View
              style={[
                styles.warningBox,
                { backgroundColor: warningColor + "15" },
              ]}
            >
              <MaterialIcons name="warning" size={14} color={warningColor} />
              <Text style={[styles.warningText, { color: warningColor }]}>
                {" "}
                {t.backup.passwordWarning}
              </Text>
            </View>
          )}

          {/* Validation error */}
          {error ? (
            <Text style={[styles.errorText, { color: dangerColor }]}>
              {error}
            </Text>
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnCancel, { borderColor }]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={[styles.btnText, { color: subtextColor }]}>
                {t.common.cancel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                styles.btnConfirm,
                { backgroundColor: primaryColor },
              ]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={[styles.btnText, { color: "#fff" }]}>
                  {isExport ? t.backup.createBackup : t.backup.restore}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 10,
    fontSize: 15,
  },
  strengthWrap: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: "700",
    width: 80,
    textAlign: "right",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  warningText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnCancel: {
    borderWidth: 1,
  },
  btnConfirm: {},
  btnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
