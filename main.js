const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  clipboard,
  systemPreferences,
} = require("electron");
const path = require("path");

const {
  DEFAULT_SHORTCUT,
  DEV_SERVER_URL,
  DEV_FLAG,
  PASTE_FOCUS_DELAY_MS,
} = require("./electron/constants");
const { loadDotEnv } = require("./electron/env");
const settings = require("./electron/settings");
const gemini = require("./electron/gemini");
const selection = require("./electron/selection");

loadDotEnv();

const AUTO_RESUME_MS = 30_000;

let mainWindow;
let lastForegroundHwnd = null;
let currentAccelerator = null;
let resumeTimer = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const isDev = process.argv.includes(DEV_FLAG);
  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
  }
  mainWindow.hide();

  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

async function onShortcutTriggered() {
  let result = { hwnd: null, text: "" };
  try {
    result = await selection.getSelection();
  } catch (e) {
    console.error("capture failed:", e);
  }
  lastForegroundHwnd = result.hwnd;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("captured-text", result.text);
    mainWindow.show();
    mainWindow.focus();
  }
}

function clearResumeTimer() {
  if (resumeTimer) {
    clearTimeout(resumeTimer);
    resumeTimer = null;
  }
}

// Registers `accelerator` as the global shortcut. Returns true on success,
// false if the OS or another app already owns it (or the string is invalid).
// Always unregisters whatever was previously registered first and cancels
// any pending auto-resume.
function applyShortcut(accelerator) {
  clearResumeTimer();
  if (currentAccelerator) {
    globalShortcut.unregister(currentAccelerator);
    currentAccelerator = null;
  }
  let ok = false;
  try {
    ok = globalShortcut.register(accelerator, onShortcutTriggered);
  } catch {
    ok = false;
  }
  if (ok) currentAccelerator = accelerator;
  return ok;
}

// Safety net: if the renderer suspends the shortcut and never resumes (crash,
// closed window, dropped IPC), restore it after AUTO_RESUME_MS.
function scheduleAutoResume() {
  clearResumeTimer();
  resumeTimer = setTimeout(() => {
    resumeTimer = null;
    applyShortcut(settings.get().shortcut || DEFAULT_SHORTCUT);
  }, AUTO_RESUME_MS);
}

function registerIpcHandlers() {
  ipcMain.handle("getSettings", () => {
    const s = settings.get();
    return { ...s, hasApiKey: !!s.apiKey };
  });

  ipcMain.handle("saveSettings", (_event, incoming) => {
    const prev = settings.get();
    const requested =
      typeof incoming?.shortcut === "string" && incoming.shortcut
        ? incoming.shortcut
        : prev.shortcut;

    if (requested !== prev.shortcut) {
      if (!applyShortcut(requested)) {
        // Rollback: re-register the previous shortcut so the app keeps working.
        applyShortcut(prev.shortcut);
        throw new Error(
          `The shortcut "${requested}" is already in use by another app or the OS. Pick a different combination.`,
        );
      }
    }
    return settings.update(incoming);
  });

  ipcMain.handle("suspendShortcut", () => {
    if (currentAccelerator) {
      globalShortcut.unregister(currentAccelerator);
      currentAccelerator = null;
    }
    scheduleAutoResume();
  });

  ipcMain.handle("resumeShortcut", () => {
    applyShortcut(settings.get().shortcut || DEFAULT_SHORTCUT);
  });

  ipcMain.handle("rephrase", async (_event, text) => gemini.rephrase(text));

  ipcMain.handle("copy", async (_event, text) => {
    clipboard.writeText(text);
  });

  ipcMain.handle("replace", async (_event, text) => {
    if (!lastForegroundHwnd || lastForegroundHwnd === "0") {
      throw new Error(
        "No source window remembered — trigger the shortcut again.",
      );
    }
    clipboard.writeText(text);
    if (mainWindow) mainWindow.hide();
    await new Promise((r) => setTimeout(r, PASTE_FOCUS_DELAY_MS));
    await selection.pasteIntoWindow(lastForegroundHwnd);
  });
}

function ensureMacAccessibility() {
  if (process.platform !== "darwin") return;
  if (!systemPreferences.isTrustedAccessibilityClient(false)) {
    systemPreferences.isTrustedAccessibilityClient(true);
  }
}

app.whenReady().then(() => {
  settings.init();
  selection.ensureScripts();
  ensureMacAccessibility();
  createMainWindow();
  registerIpcHandlers();

  const desired = settings.get().shortcut || DEFAULT_SHORTCUT;
  if (!applyShortcut(desired) && desired !== DEFAULT_SHORTCUT) {
    // Saved shortcut isn't available — fall back to the default so the
    // app stays usable.
    applyShortcut(DEFAULT_SHORTCUT);
  }
  if (!currentAccelerator) {
    console.error(`Failed to register any shortcut (tried: ${desired})`);
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  // Keep app running in the background for the global shortcut.
});
