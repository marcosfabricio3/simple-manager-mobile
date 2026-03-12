import { translations } from "../../../presentation/translations/translations";

describe("translations module", () => {
  it("should have all required top-level modules for Spanish (es)", () => {
    expect(translations.es.common).toBeDefined();
    expect(translations.es.dashboard).toBeDefined();
    expect(translations.es.calendar).toBeDefined();
    expect(translations.es.clients).toBeDefined();
    expect(translations.es.settings).toBeDefined();
  });

  it("should have all required top-level modules for English (en)", () => {
    expect(translations.en.common).toBeDefined();
    expect(translations.en.dashboard).toBeDefined();
    expect(translations.en.calendar).toBeDefined();
    expect(translations.en.clients).toBeDefined();
    expect(translations.en.settings).toBeDefined();
  });

  it("ES and EN should have exactly the same keys structure", () => {
    const esKeys = Object.keys(translations.es);
    const enKeys = Object.keys(translations.en);
    expect(esKeys).toEqual(enKeys);
  });

  it("should have the same sub-keys in common for both languages", () => {
    const esCommonKeys = Object.keys(translations.es.common);
    const enCommonKeys = Object.keys(translations.en.common);
    expect(esCommonKeys).toEqual(enCommonKeys);
  });

  it("should have the same sub-keys in dashboard for both languages", () => {
    const esDashKeys = Object.keys(translations.es.dashboard);
    const enDashKeys = Object.keys(translations.en.dashboard);
    expect(esDashKeys).toEqual(enDashKeys);
  });

  it("should have the same sub-keys in settings for both languages", () => {
    const esSettingsKeys = Object.keys(translations.es.settings);
    const enSettingsKeys = Object.keys(translations.en.settings);
    expect(esSettingsKeys).toEqual(enSettingsKeys);
  });

  it("should have different values for ES and EN (not just copies)", () => {
    // If both were identical, the translation system would be broken
    expect(translations.es.dashboard.title).not.toBe(
      translations.en.dashboard.title,
    );
    expect(translations.es.common.save).not.toBe(translations.en.common.save);
    expect(translations.es.settings.language).not.toBe(
      translations.en.settings.language,
    );
  });

  it("all values in ES translations should be non-empty strings", () => {
    function checkAllStrings(obj: Record<string, any>, path = "es") {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          expect(value.trim().length).toBeGreaterThan(0);
        } else if (typeof value === "object") {
          checkAllStrings(value, `${path}.${key}`);
        }
      }
    }
    checkAllStrings(translations.es);
  });

  it("all values in EN translations should be non-empty strings", () => {
    function checkAllStrings(obj: Record<string, any>, path = "en") {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          expect(value.trim().length).toBeGreaterThan(0);
        } else if (typeof value === "object") {
          checkAllStrings(value, `${path}.${key}`);
        }
      }
    }
    checkAllStrings(translations.en);
  });
});
