import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { useI18n } from "@/src/presentation/translations/useI18n";
import * as LocalAuthentication from "expo-local-authentication";
import { router, useRootNavigationState } from "expo-router";
import React, { ReactNode, useEffect, useState, useRef, useCallback } from "react";
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
  const { biometricLockEnabled, hasSeenOnboarding, darkMode } = useSettingsStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { t } = useI18n();
  
  const theme = darkMode ? "dark" : "light";
  const colors = Colors[theme];

  const isAuthenticating = useRef(false);
  const appState = useRef(AppState.currentState);

  // Navigation state needed before we can redirect
  const navState = useRootNavigationState();
  const navReady = !!navState?.key;

  const authenticate = useCallback(async (isAuto = false) => {
    if (isAuthenticating.current) {
        console.log("Auth already in progress, skipping...");
        return;
    }

    try {
      isAuthenticating.current = true;
      
      // Determine security level: 0 (None), 1 (PIN/Pattern/Pass), 2 (Biometric)
      const enrolledLevel = await LocalAuthentication.getEnrolledLevelAsync();

      if (enrolledLevel === LocalAuthentication.SecurityLevel.NONE) {
        setIsAuthenticated(true);
        setIsChecking(false);
        return;
      }

      // Small delay for automatic trigger to ensure OS is ready
      if (isAuto) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t.auth.prompt,
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
      if (!isAuto) {
        Alert.alert(t.common.error, t.common.error === "Error" ? "No se pudo autenticar" : "Authentication failed");
      }
    } finally {
      isAuthenticating.current = false;
      setIsChecking(false);
    }
  }, [t.auth.prompt, t.common.error]);

  // Biometric check on mount
  useEffect(() => {
    if (!biometricLockEnabled) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }

    // Initial check
    authenticate();

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        // Only lock if transitioning from background/inactive to active
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active" &&
          biometricLockEnabled
        ) {
          console.log("App resumed, re-authenticating...");
          setIsAuthenticated(false);
          authenticate(true);
        }
        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, [biometricLockEnabled, authenticate]);

  // Onboarding redirect — runs once navigation is ready
  useEffect(() => {
    if (!navReady || isChecking || !isAuthenticated) return;
    
    if (!hasSeenOnboarding) {
      router.replace("/onboarding");
    }
  }, [navReady, isChecking, isAuthenticated, hasSeenOnboarding]);

  // --- Not using biometrics ---
  if (!biometricLockEnabled) {
    return <>{children}</>;
  }

  // --- Checking hardware on start ---
  if (isChecking && !isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.text, { color: colors.subtext }]}>
          {t.common.loading}
        </Text>
      </View>
    );
  }

  // --- Not authenticated UI (Lock Screen) ---
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <IconSymbol name="lock.fill" size={64} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>
          {t.auth.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          {t.auth.subtitle}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
          onPress={() => authenticate(false)}
        >
          <Text style={styles.buttonText}>
            {t.auth.button}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Authenticated ---
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
    minWidth: 160,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
