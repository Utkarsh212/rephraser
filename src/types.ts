export type Settings = {
  apiKey: string;
  model: string;
  hasApiKey?: boolean;
};

export type SaveSettingsInput = {
  apiKey: string;
  model: string;
};

export type View = "main" | "settings";

type Platform = string;

declare global {
  interface Window {
    electronAPI: {
      platform: Platform;
      onCapturedText: (
        callback: (event: unknown, text: string) => void,
      ) => () => void;
      rephrase: (text: string) => Promise<string>;
      copy: (text: string) => Promise<void>;
      replace: (text: string) => Promise<void>;
      getSettings: () => Promise<Settings>;
      saveSettings: (settings: SaveSettingsInput) => Promise<Settings>;
    };
  }
}
