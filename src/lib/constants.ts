export const APP_NAME = "Rephraser";

const isMac =
  typeof window !== "undefined" && window.electronAPI?.platform === "darwin";
export const SHORTCUT_LABEL = isMac ? "⌘+⌥+J" : "Ctrl+Alt+J";

export const DEFAULT_MODEL = "gemini-2.5-flash";

type ModelOption = { value: string; label: string };

export const MODELS: readonly ModelOption[] = [
  { value: "gemini-2.5-flash", label: "gemini-2.5-flash (balanced)" },
  {
    value: "gemini-2.5-flash-lite",
    label: "gemini-2.5-flash-lite (fastest, cheapest)",
  },
  { value: "gemini-2.5-pro", label: "gemini-2.5-pro (highest quality)" },
] as const;

export const COPIED_FEEDBACK_MS = 1200;

export const API_KEY_DOCS_URL = "aistudio.google.com/apikey";

export const STRINGS = {
  header: {
    title: APP_NAME,
    hintPrefix: "Press",
    hintSuffix: "anywhere to capture text",
  },
  capture: {
    sectionLabel: "Selected text",
    placeholder: `Press ${SHORTCUT_LABEL} after selecting text in any app — or type/paste text here.`,
  },
  rephrase: {
    button: "Rephrase",
    pending: "Rephrasing…",
    sectionLabel: "Rephrased",
    pendingMessage: "Rephrasing your text…",
    pendingHint: "This usually takes a second or two.",
  },
  empty: {
    message: "No rephrased text yet",
    hint: "Click Rephrase to generate a new version.",
  },
  copy: {
    button: "Copy",
    success: "Copied!",
  },
  replace: {
    button: "Replace",
    pending: "Replacing…",
  },
  settings: {
    title: "Settings",
    subtitle: "Manage your API key and model preference.",
    welcomeTitle: "Welcome to Rephraser",
    welcomeSubtitle: "Add a Gemini API key to enable rephrasing.",
    save: "Save",
    saving: "Saving…",
    cancel: "Cancel",
    apiKeyLabel: "Gemini API key",
    apiKeyPlaceholder: "AIza...",
    apiKeyHelpPrefix: "Get a key at",
    apiKeyHelpSuffix: ". Stored locally on this machine.",
    modelLabel: "Model",
  },
  loading: {
    settings: "Loading settings…",
  },
  errors: {
    settingsLoad: "Failed to load settings",
    apiKeyRequired: "API key is required",
    modelRequired: "Model is required",
  },
};
