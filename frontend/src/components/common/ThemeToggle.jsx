import { useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";

import { useAppSettings } from "../../context/AppSettingsContext";

import "../../styles/themeToggle.css";

function ThemeToggle() {
  const { theme, toggleTheme } = useAppSettings();
  const [failedIconSource, setFailedIconSource] = useState(null);

  const isDarkTheme = theme === "dark";

  const iconSource = isDarkTheme
    ? "/icons/sun-theme.png"
    : "/icons/moon-theme.png";

  const buttonLabel = isDarkTheme
    ? "Activează tema luminoasă"
    : "Activează tema întunecată";

  const customIconIsAvailable = failedIconSource !== iconSource;

  return (
    <button
      className="theme-toggle-button"
      type="button"
      onClick={toggleTheme}
      aria-label={buttonLabel}
      title={buttonLabel}
    >
      {customIconIsAvailable ? (
        <img
          key={iconSource}
          src={iconSource}
          alt=""
          onError={() => setFailedIconSource(iconSource)}
        />
      ) : isDarkTheme ? (
        <SunMedium size={24} />
      ) : (
        <MoonStar size={24} />
      )}

      <span className="theme-toggle-tooltip">
        {isDarkTheme ? "Light" : "Dark"}
      </span>
    </button>
  );
}

export default ThemeToggle;