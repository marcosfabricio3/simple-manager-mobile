import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * A robust hook to calculate the top padding for screens,
 * accounting for Android edge-to-edge issues where insets might be zero.
 */
export const useSafeTopPadding = (minPadding = 35) => {
  const insets = useSafeAreaInsets();
  
  return Math.max(
    insets.top,
    Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
    minPadding
  );
};
