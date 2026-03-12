import { Colors } from "@/constants/theme";
import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { useI18n } from "@/src/presentation/translations/useI18n";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// Slide content icons (Material)
// ---------------------------------------------------------------------------
const SLIDE_ICONS: Array<keyof typeof MaterialIcons.glyphMap> = [
  "event-note",
  "people-alt",
  "lock",
];

const SLIDE_COLORS = ["#7C9CF5", "#A8DADC", "#34C759"];

// ---------------------------------------------------------------------------
// OnboardingScreen
// ---------------------------------------------------------------------------
export default function OnboardingScreen() {
  const { darkMode, setHasSeenOnboarding } = useSettingsStore();
  const colors = Colors[darkMode ? "dark" : "light"];
  const { t } = useI18n();
  const ob = t.onboarding;

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slides = [
    {
      icon: SLIDE_ICONS[0],
      color: SLIDE_COLORS[0],
      title: ob.slide1Title,
      subtitle: ob.slide1Subtitle,
    },
    {
      icon: SLIDE_ICONS[1],
      color: SLIDE_COLORS[1],
      title: ob.slide2Title,
      subtitle: ob.slide2Subtitle,
    },
    {
      icon: SLIDE_ICONS[2],
      color: SLIDE_COLORS[2],
      title: ob.slide3Title,
      subtitle: ob.slide3Subtitle,
    },
  ];

  const isLast = activeIndex === slides.length - 1;

  const animateFade = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(callback, 150);
  };

  const goToSlide = (index: number) => {
    animateFade(() => {
      setActiveIndex(index);
      scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: false });
    });
  };

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      goToSlide(activeIndex + 1);
    }
  };

  const finish = () => {
    setHasSeenOnboarding();
    router.replace("/(tabs)");
  };

  const currentSlide = slides[activeIndex];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} />

      {/* Skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={finish}>
        <Text style={[styles.skipText, { color: colors.subtext }]}>
          {ob.skip}
        </Text>
      </TouchableOpacity>

      {/* Slide content (animated) */}
      <Animated.View style={[styles.slideContent, { opacity: fadeAnim }]}>
        {/* Icon */}
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: currentSlide.color + "18" },
          ]}
        >
          <View
            style={[
              styles.iconInner,
              { backgroundColor: currentSlide.color + "30" },
            ]}
          >
            <MaterialIcons
              name={currentSlide.icon}
              size={52}
              color={currentSlide.color}
            />
          </View>
        </View>

        {/* Texts */}
        <Text style={[styles.title, { color: colors.text }]}>
          {currentSlide.title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          {currentSlide.subtitle}
        </Text>
      </Animated.View>

      {/* Dots indicator */}
      <View style={styles.dotsRow}>
        {slides.map((s, i) => (
          <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex ? currentSlide.color : colors.border,
                  width: i === activeIndex ? 24 : 8,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.ctaBtn, { backgroundColor: currentSlide.color }]}
        onPress={handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaBtnText}>
          {isLast ? ob.getStarted : ob.next}
        </Text>
        <MaterialIcons
          name={isLast ? "rocket-launch" : "arrow-forward"}
          size={20}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  skipBtn: {
    position: "absolute",
    top: 60,
    right: 24,
    padding: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "600",
  },
  slideContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingBottom: 40,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  iconInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    height: 56,
    borderRadius: 16,
    marginBottom: 48,
  },
  ctaBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});
