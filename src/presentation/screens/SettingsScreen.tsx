import { useToast } from "@/components/context/ToastContext";
import { Colors } from "@/constants/theme";
import { DatabaseBackupService } from "@/src/application/services/DatabaseBackupService";
import { PdfReportService } from "@/src/application/services/PdfReportService";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { db } from "@/src/infrastructure/database/database";
import { BillingMethodsModal } from "@/src/presentation/components/BillingMethodsModal";
import { PassphraseModal } from "@/src/presentation/components/PassphraseModal";
import { SettingsItem } from "@/src/presentation/components/SettingsItem";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeTopPadding } from "@/src/presentation/hooks/useSafeTopPadding";

export default function SettingsScreen() {
  const {
    darkMode,
    notificationsEnabled,
    notificationAdvanceMin,
    biometricLockEnabled,
    language,
    freeBillingEnabled,
    freeBillingPaymentMethods,
    updateSettings,
  } = useSettingsStore();

  const { addToast } = useToast();

  const theme = darkMode ? "dark" : "light";
  const { t } = useI18n();
  const colors = Colors[theme];
  const paddingTop = useSafeTopPadding();

  // ---------------------------------------------------------------------------
  // Passphrase Modal state
  // ---------------------------------------------------------------------------
  const [passphraseModal, setPassphraseModal] = useState<{
    visible: boolean;
    mode: "export" | "import";
    pendingFileUri?: string;
    loading: boolean;
  }>({ visible: false, mode: "export", loading: false });
  const [billingMethodsModalVisible, setBillingMethodsModalVisible] = useState(false);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleLanguagePress = () => {
    Alert.alert(t.settings.language, t.settings.selectLanguage, [
      { text: t.common.cancel, style: "cancel" },
      { text: "Español", onPress: () => updateSettings({ language: "es" }) },
      { text: "English", onPress: () => updateSettings({ language: "en" }) },
    ]);
  };

  const handleServicesNav = () => router.push("/settings/services");

  const handleGenerateReport = async () => {
    const pdfService = new PdfReportService();
    // In Settings, this is typically a generalized report trigger
    // Using empty list as placeholder since it's a generic action button
    await pdfService.generateReport([], t.settings.exportPdf, t, language);
  };

  const handleExportDb = () => {
    setPassphraseModal({ visible: true, mode: "export", loading: false });
  };

  const handleImportDb = async () => {
    const backupService = new DatabaseBackupService();
    const fileUri = await backupService.pickBackupFile(language);
    if (!fileUri) return;

    setPassphraseModal({
      visible: true,
      mode: "import",
      pendingFileUri: fileUri,
      loading: false,
    });
  };

  const handlePassphraseConfirm = async (passphrase: string) => {
    const backupService = new DatabaseBackupService();
    setPassphraseModal((prev) => ({ ...prev, loading: true }));

    try {
      if (passphraseModal.mode === "export") {
        await backupService.exportSecureBackup(passphrase, language);
      } else if (
        passphraseModal.mode === "import" &&
        passphraseModal.pendingFileUri
      ) {
        await backupService.importSecureBackup(
          passphraseModal.pendingFileUri,
          passphrase,
          language,
        );
      }
    } finally {
      setPassphraseModal({ visible: false, mode: "export", loading: false });
    }
  };

  const handlePassphraseCancel = () => {
    setPassphraseModal({ visible: false, mode: "export", loading: false });
  };

  const handleFreeBillingMethodsPress = () => {
    setBillingMethodsModalVisible(true);
  };

  const handleWipeData = () => {
    Alert.alert(
      t.settings.deleteAllConfirmTitle,
      t.settings.deleteAllConfirmMsg,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.common.delete,
          style: "destructive",
          onPress: async () => {
            try {
              await db.execAsync(`
                PRAGMA foreign_keys = OFF;
                DROP TABLE IF EXISTS appointment_services;
                DROP TABLE IF EXISTS appointments;
                DROP TABLE IF EXISTS services;
                DROP TABLE IF EXISTS clients;
                DROP TABLE IF EXISTS records;
                PRAGMA foreign_keys = ON;
              `);
              addToast(t.settings.deleteAllSuccess, "success");
            } catch (error) {
              console.error(error);
              addToast(t.settings.deleteAllError, "error");
            }
          },
        },
      ],
    );
  };

  const handleAdvancePress = () => {
    Alert.alert(t.settings.reminderAdvance, "", [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.settings.reminderAtTimeLabel,
        onPress: () => updateSettings({ notificationAdvanceMin: 0 }),
      },
      {
        text: t.settings.reminder15minLabel,
        onPress: () => updateSettings({ notificationAdvanceMin: 15 }),
      },
      {
        text: t.settings.reminder30minLabel,
        onPress: () => updateSettings({ notificationAdvanceMin: 30 }),
      },
      {
        text: t.settings.reminder1hourLabel,
        onPress: () => updateSettings({ notificationAdvanceMin: 60 }),
      },
    ]);
  };

  const formatAdvance = (mins: number): string => {
    if (mins === 0) return t.settings.reminderAtTime;
    if (mins === 60) return t.settings.reminder1hour;
    if (mins === 30) return t.settings.reminder30min;
    return t.settings.reminder15min;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop,
          },
        ]}
      >
        <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {t.settings.title}
        </Text>

        {/* ----- Business ----- */}
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
          {t.settings.business}
        </Text>
        <View
          style={[styles.sectionContainer, { backgroundColor: colors.card }]}
        >
          <SettingsItem
            icon="list.bullet"
            title={t.settings.myServices}
            subtitle={t.settings.myServicesSubtitle}
            type="link"
            onPress={handleServicesNav}
          />
          <SettingsItem
            icon="play.circle.fill"
            title={t.settings.launchTutorial}
            subtitle={t.settings.launchTutorialSubtitle}
            type="action"
            onPress={() => {
              updateSettings({ tutorialStep: 1, hasSeenOnboarding: false });
              router.replace("/onboarding" as any);
            }}
          />
          <SettingsItem
            icon="doc.text.fill"
            title={t.settings.exportPdf}
            subtitle={t.settings.exportPdfSubtitle}
            type="action"
            onPress={handleGenerateReport}
          />
        </View>

        {/* ----- App Preferences ----- */}
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
          {t.settings.appPreferences}
        </Text>
        <View
          style={[styles.sectionContainer, { backgroundColor: colors.card }]}
        >
          <SettingsItem
            icon="globe"
            title={t.settings.language}
            type="select"
            value={language === "es" ? "Español" : "English"}
            onPress={handleLanguagePress}
          />
          <SettingsItem
            icon="moon.fill"
            title={t.settings.darkMode}
            type="switch"
            value={darkMode}
            onValueChange={(val) =>
              updateSettings({ darkMode: val as boolean })
            }
          />
          <SettingsItem
            icon="bell.fill"
            title={t.settings.notifications}
            type="switch"
            value={notificationsEnabled}
            onValueChange={(val) =>
              updateSettings({ notificationsEnabled: val as boolean })
            }
            hideSeparator={true}
          />
          <SettingsItem
            icon="none"
            title={t.settings.reminderAdvance}
            type="select"
            value={formatAdvance(notificationAdvanceMin)}
            onPress={handleAdvancePress}
            disabled={!notificationsEnabled}
          />
          <SettingsItem
            icon="lock.fill"
            title={t.settings.biometrics}
            subtitle={t.settings.biometricsSubtitle}
            type="switch"
            value={biometricLockEnabled}
            onValueChange={(val) =>
              updateSettings({ biometricLockEnabled: val as boolean })
            }
          />
          <SettingsItem
            icon="doc.plaintext.fill"
            title={t.settings.freeBilling}
            subtitle={t.settings.freeBillingSubtitle}
            type="switch"
            value={freeBillingEnabled}
            onValueChange={(val) =>
              updateSettings({ freeBillingEnabled: val as boolean })
            }
            hideSeparator={true}
          />
          <SettingsItem
            icon="none"
            title={t.settings.selectBillingMethods}
            type="select"
            value={`${freeBillingPaymentMethods.length} seleccionados`}
            onPress={handleFreeBillingMethodsPress}
            disabled={!freeBillingEnabled}
          />
        </View>

        {/* ----- Advanced Data ----- */}
        <Text style={[styles.sectionTitle, { color: colors.subtext }]}>
          {t.settings.advancedData}
        </Text>
        <View
          style={[styles.sectionContainer, { backgroundColor: colors.card }]}
        >
          <SettingsItem
            icon="arrow.up.doc.fill"
            title={t.settings.exportBackup}
            subtitle={t.settings.exportBackupSubtitle}
            type="action"
            onPress={handleExportDb}
          />
          <SettingsItem
            icon="arrow.down.doc.fill"
            title={t.settings.importBackup}
            subtitle={t.settings.importBackupSubtitle}
            type="action"
            onPress={handleImportDb}
          />
          <SettingsItem
            icon="trash.fill"
            title={t.settings.deleteAll}
            subtitle={t.settings.deleteAllSubtitle}
            type="action"
            destructive
            onPress={handleWipeData}
          />
        </View>
      </ScrollView>

      {/* Passphrase modal (outside ScrollView so it renders above everything) */}
      <PassphraseModal
        visible={passphraseModal.visible}
        mode={passphraseModal.mode}
        loading={passphraseModal.loading}
        onConfirm={handlePassphraseConfirm}
        onCancel={handlePassphraseCancel}
      />

      <BillingMethodsModal
        visible={billingMethodsModalVisible}
        onClose={() => setBillingMethodsModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 24,
    marginLeft: 4,
  },
  sectionContainer: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "transparent",
  },
});
