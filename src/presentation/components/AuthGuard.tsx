import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { useI18n } from "@/src/presentation/translations/useI18n";
import * as LocalAuthentication from "expo-local-authentication";
import { router, useRootNavigationState } from "expo-router";
import React, { ReactNode, useEffect, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface AuthGuardProps {
  children: ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { biometricLockEnabled, hasSeenOnboarding } = useSettingsStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { t } = useI18n();
  const colors = Colors.light;

  // Navigation state needed before we can redirect
  const navState = useRootNavigationState();
  const navReady = !!navState?.key;

  const authenticate = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:
          t.common.attention === "Atención"
            ? "Autenticación requerida"
            : "Authentication required",
        fallbackLabel: "PIN",
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth error", error);
      Alert.alert(t.common.error, "No se pudo autenticar");
    } finally {
      setIsChecking(false);
    }
  };

  // Biometric check on mount
  useEffect(() => {
    if (!biometricLockEnabled) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }
    authenticate();

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active" && biometricLockEnabled) {
          setIsAuthenticated(false);
          authenticate();
        }
      },
    );

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricLockEnabled]);

  // Onboarding redirect — runs once navigation is ready
  useEffect(() => {
    if (!navReady) return;
    if (isChecking) return;
    if (!isAuthenticated) return;
    if (!hasSeenOnboarding) {
      router.replace("/onboarding");
    }
  }, [navReady, isChecking, isAuthenticated, hasSeenOnboarding]);

  // --- Not using biometrics ---
  if (!biometricLockEnabled) {
    return <>{children}</>;
  }

  // --- Checking biometrics ---
  if (isChecking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.subtext }]}>
          {t.common.loading}
        </Text>
      </View>
    );
  }

  // --- Not authenticated ---
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <IconSymbol name="lock.fill" size={64} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          {t.common.attention === "Atención"
            ? "Aplicación Bloqueada"
            : "App Locked"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          {t.common.attention === "Atención"
            ? "Usa tu huella o reconocimiento facial para entrar."
            : "Use your fingerprint or face ID to unlock."}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={authenticate}
        >
          <Text style={styles.buttonText}>
            {t.common.attention === "Atención" ? "Desbloquear" : "Unlock"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 22,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
