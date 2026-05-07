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
  SHORTCUT_ACCELERATOR,
  DEV_SERVER_URL,
  DEV_FLAG,
  PASTE_FOCUS_DELAY_MS,
} = require("./electron/constants");
const { loadDotEnv } = require("./electron/env");
const settings = require("./electron/settings");
const gemini = require("./electron/gemini");
const selection = require("./electron/selection");

loadDotEnv();

let mainWindow;
let lastForegroundHwnd = null;

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

  // Closing the window destroys it; hide instead so the shortcut can re-show it.
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function registerIpcHandlers() {
  ipcMain.handle("getSettings", () => {
    const s = settings.get();
    return { ...s, hasApiKey: !!s.apiKey };
  });

  ipcMain.handle("saveSettings", (_event, incoming) => settings.update(incoming));

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

function registerShortcut() {
  const ok = globalShortcut.register(SHORTCUT_ACCELERATOR, async () => {
    // Capture before showing the window — once focus moves to Electron,
    // we'd be reading our own (empty) input instead of the user's selection.
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
  });
  if (!ok) {
    console.error(`Failed to register shortcut: ${SHORTCUT_ACCELERATOR}`);
  }
}

function ensureMacAccessibility() {
  if (process.platform !== "darwin") return;
  // Prompts the user (once) to grant Accessibility permission. Required so
  // System Events can read the frontmost app and send Cmd+C / Cmd+V.
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
  registerShortcut();
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
