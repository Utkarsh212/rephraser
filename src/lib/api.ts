import type { ModelOption, SaveSettingsInput, Settings } from "../types";

const api = window.electronAPI;

export const getSettings = (): Promise<Settings> => api.getSettings();
export const saveSettings = (settings: SaveSettingsInput): Promise<Settings> =>
  api.saveSettings(settings);
export const rephrase = (text: string): Promise<string> => api.rephrase(text);
export const listModels = (apiKey?: string): Promise<ModelOption[]> =>
  api.listModels(apiKey);
export const copyToClipboard = (text: string): Promise<void> => api.copy(text);
export const replaceSelection = (text: string): Promise<void> =>
  api.replace(text);
export const onCapturedText = (
  cb: (event: unknown, text: string) => void,
): (() => void) => api.onCapturedText(cb);
export const suspendShortcut = (): Promise<void> => api.suspendShortcut();
export const resumeShortcut = (): Promise<void> => api.resumeShortcut();
