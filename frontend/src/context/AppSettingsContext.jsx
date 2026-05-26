import { createContext, useContext, useEffect, useState } from "react";

import {
  getAppSettings,
  updateAppSettings,
} from "../services/settingsService";

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => getAppSettings());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", settings.theme);
    document.documentElement.style.colorScheme = settings.theme;
  }, [settings.theme]);

  function changeTheme(theme) {
    const updatedSettings = updateAppSettings({ theme });

    setSettings(updatedSettings);
  }

  function toggleTheme() {
    changeTheme(settings.theme === "dark" ? "light" : "dark");
  }

  function updateSetting(settingName, value) {
    const updatedSettings = updateAppSettings({
      [settingName]: value,
    });

    setSettings(updatedSettings);
  }

  return (
    <AppSettingsContext.Provider
      value={{
        settings,
        theme: settings.theme,
        toggleTheme,
        changeTheme,
        updateSetting,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error(
      "useAppSettings trebuie folosit în interiorul AppSettingsProvider."
    );
  }

  return context;
}