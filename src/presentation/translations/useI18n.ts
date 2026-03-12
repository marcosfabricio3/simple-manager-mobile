import { useSettingsStore } from "@/src/application/state/useSettingsStore";
import { TranslationKeys, translations } from "./translations";

export function useI18n() {
  const { language } = useSettingsStore();

  // Safe fallback to Spanish if language is not set or not found
  const t: TranslationKeys =
    translations[language as keyof typeof translations] || translations.es;

  return { t, language };
}
