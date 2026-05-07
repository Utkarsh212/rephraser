import { useEffect } from "react";
import { useSettings } from "./lib/queries";
import { onCapturedText } from "./lib/api";
import { useUiStore } from "./store/uiStore";
import { STRINGS } from "./lib/constants";
import MainView from "./components/MainView";
import SettingsView from "./components/SettingsView";
import { AppShell } from "./components/AppShell";
import { Header } from "./components/Header";
import { LoadingState, ErrorBanner } from "./components/ui";

export default function App() {
  const { data: settings, isLoading, isError, error } = useSettings();
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const setCapturedText = useUiStore((s) => s.setCapturedText);

  useEffect(() => {
    if (!isLoading && settings && !settings.hasApiKey) {
      setView("settings");
    }
  }, [isLoading, settings, setView]);

  useEffect(() => {
    return onCapturedText((_event, text) => setCapturedText(text || ""));
  }, [setCapturedText]);

  return (
    <AppShell>
      <Header />
      {isLoading ? (
        <LoadingState message={STRINGS.loading.settings} />
      ) : isError ? (
        <ErrorBanner
          message={(error as Error)?.message || STRINGS.errors.settingsLoad}
        />
      ) : view === "settings" ? (
        <SettingsView isFirstRun={!settings?.hasApiKey} />
      ) : (
        <MainView />
      )}
    </AppShell>
  );
}
