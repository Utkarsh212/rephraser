import type { SaveSettingsInput, Settings } from "../types";

if (!window.electronAPI) {
  // eslint-disable-next-line no-console
  console.error("window.electronAPI is undefined — preload script did not run.");
}

const api = window.electronAPI;

export const getSettings = (): Promise<Settings> => api.getSettings();
export const saveSettings = (settings: SaveSettingsInput): Promise<Settings> =>
  api.saveSettings(settings);
export const rephrase = (text: string): Promise<string> => api.rephrase(text);
export const copyToClipboard = (text: string): Promise<void> => api.copy(text);
export const replaceSelection = (text: string): Promise<void> =>
  api.replace(text);
export const onCapturedText = (
  cb: (event: unknown, text: string) => void,
): (() => void) => api.onCapturedText(cb);
