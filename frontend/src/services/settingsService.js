const SETTINGS_STORAGE_KEY = "studybloom_settings";

const DEFAULT_SETTINGS = {
  manualReviewAfterImport: true,
  theme: "dark",
};

export function getAppSettings() {
  try {
    const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!storedSettings) {
      return DEFAULT_SETTINGS;
    }

    return {
      ...DEFAULT_SETTINGS,
      ...JSON.parse(storedSettings),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function updateAppSettings(newSettings) {
  const currentSettings = getAppSettings();

  const updatedSettings = {
    ...currentSettings,
    ...newSettings,
  };

  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify(updatedSettings)
  );

  return updatedSettings;
}