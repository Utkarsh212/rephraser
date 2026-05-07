const {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  clipboard,
} = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFile } = require("child_process");

let mainWindow;
let lastForegroundHwnd = null;

// Load KEY=VALUE pairs from a local .env into process.env (without overriding
// values already set in the real environment).
function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
loadDotEnv();

const DEFAULT_MODEL = "gemini-2.5-flash";
let settings = { apiKey: "", model: DEFAULT_MODEL };

function settingsFilePath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function loadSettingsFromDisk() {
  try {
    const raw = fs.readFileSync(settingsFilePath(), "utf8");
    const data = JSON.parse(raw);
    return {
      apiKey: typeof data.apiKey === "string" ? data.apiKey : "",
      model:
        typeof data.model === "string" && data.model
          ? data.model
          : DEFAULT_MODEL,
    };
  } catch {
    return null;
  }
}

function persistSettings() {
  const p = settingsFilePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(settings, null, 2), "utf8");
}

function initSettings() {
  const loaded = loadSettingsFromDisk();
  if (loaded) {
    settings = loaded;
    return;
  }
  // First run — seed from .env if it has a key, then persist so future
  // launches use the on-disk file as the single source of truth.
  settings = {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: DEFAULT_MODEL,
  };
  if (settings.apiKey) persistSettings();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("index.html");
  mainWindow.webContents.send("message", "Hello from main process!");
  mainWindow.hide(); // Hide initially

  // Closing the window would destroy it; hide instead so the shortcut can re-show it.
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

const captureScriptPath = path.join(os.tmpdir(), "electron-app-capture.ps1");
const captureScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Kbd {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public const byte VK_CONTROL = 0x11;
    public const byte VK_MENU = 0x12;
    public const byte VK_SHIFT = 0x10;
    public const byte VK_LWIN = 0x5B;
    public const byte VK_C = 0x43;
    public const uint KEYUP = 0x2;
}
public class Win {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
}
"@

# Capture the source window first so we can paste back into it later.
$hwnd = [Win]::GetForegroundWindow()

$prev = ''
try { $prev = [System.Windows.Forms.Clipboard]::GetText() } catch {}
try { [System.Windows.Forms.Clipboard]::Clear() } catch {}

# Force-release any held modifiers from the triggering hotkey (Ctrl+Alt+J).
[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_MENU,    0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_SHIFT,   0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_LWIN,    0, [Kbd]::KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 80

[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_C, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_C, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)

Start-Sleep -Milliseconds 250
$captured = ''
try { $captured = [System.Windows.Forms.Clipboard]::GetText() } catch {}
try { if ($prev) { [System.Windows.Forms.Clipboard]::SetText($prev) } } catch {}

# Output: HWND on first line, captured text after.
[Console]::Out.WriteLine($hwnd.ToInt64())
[Console]::Out.Write($captured)
`;
fs.writeFileSync(captureScriptPath, captureScript, "utf8");

const replaceScriptPath = path.join(os.tmpdir(), "electron-app-replace.ps1");
const replaceScript = `
param([Parameter(Mandatory=$true)][long]$Hwnd)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class Kbd {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public const byte VK_CONTROL = 0x11;
    public const byte VK_MENU = 0x12;
    public const byte VK_SHIFT = 0x10;
    public const byte VK_LWIN = 0x5B;
    public const byte VK_V = 0x56;
    public const uint KEYUP = 0x2;
}
public class Win {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    public static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);
    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, IntPtr ProcessId);
    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();
}
"@

# Restore foreground. SetForegroundWindow alone usually fails when called
# from a non-foreground process; the AttachThreadInput trick works around it.
$h = [IntPtr]$Hwnd
$targetThread = [Win]::GetWindowThreadProcessId($h, [IntPtr]::Zero)
$currentThread = [Win]::GetCurrentThreadId()
[void][Win]::AttachThreadInput($currentThread, $targetThread, $true)
[void][Win]::ShowWindow($h, 9)  # SW_RESTORE
[void][Win]::SetForegroundWindow($h)
[void][Win]::AttachThreadInput($currentThread, $targetThread, $false)

Start-Sleep -Milliseconds 150

# Force-release modifiers
[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_MENU,    0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_SHIFT,   0, [Kbd]::KEYUP, [UIntPtr]::Zero)
[Kbd]::keybd_event([Kbd]::VK_LWIN,    0, [Kbd]::KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 60

# Send Ctrl+V
[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_V, 0, 0, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_V, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)
Start-Sleep -Milliseconds 30
[Kbd]::keybd_event([Kbd]::VK_CONTROL, 0, [Kbd]::KEYUP, [UIntPtr]::Zero)
`;
fs.writeFileSync(replaceScriptPath, replaceScript, "utf8");

function getSelection() {
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-STA",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        captureScriptPath,
      ],
      { maxBuffer: 10 * 1024 * 1024, windowsHide: true },
      (error, stdout) => {
        if (error) {
          console.error("Error executing capture PowerShell:", error);
          resolve({ hwnd: null, text: "" });
          return;
        }
        const newlineIdx = stdout.indexOf("\n");
        if (newlineIdx === -1) {
          resolve({ hwnd: null, text: "" });
          return;
        }
        const hwnd = stdout.slice(0, newlineIdx).trim();
        const text = stdout.slice(newlineIdx + 1).replace(/\r\n$/, "");
        resolve({ hwnd, text });
      },
    );
  });
}

function pasteIntoWindow(hwnd) {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-STA",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        replaceScriptPath,
        "-Hwnd",
        String(hwnd),
      ],
      { windowsHide: true },
      (error) => {
        if (error) reject(error);
        else resolve();
      },
    );
  });
}

async function rephraseWithGemini(text) {
  if (!settings.apiKey) {
    throw new Error("API key not configured. Open Settings to add one.");
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`;
  const body = {
    contents: [
      {
        parts: [
          {
            text: `Rephrase the following text. Respond with ONLY the rephrased version — no preamble, no quotes, no explanation:\n\n${text}`,
          },
        ],
      },
    ],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const out = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!out) throw new Error("Gemini returned no text");
  return out.trim();
}

ipcMain.handle("getSettings", () => ({
  apiKey: settings.apiKey,
  model: settings.model,
  hasApiKey: !!settings.apiKey,
}));

ipcMain.handle("saveSettings", (_event, incoming) => {
  if (typeof incoming?.apiKey === "string") {
    settings.apiKey = incoming.apiKey.trim();
  }
  if (typeof incoming?.model === "string" && incoming.model) {
    settings.model = incoming.model;
  }
  persistSettings();
  return { apiKey: settings.apiKey, model: settings.model };
});

ipcMain.handle("rephrase", async (_event, text) => {
  return await rephraseWithGemini(text);
});

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
  // Give Windows a moment to transfer focus before SetForegroundWindow runs.
  await new Promise((r) => setTimeout(r, 120));
  await pasteIntoWindow(lastForegroundHwnd);
});

app.whenReady().then(() => {
  initSettings();
  createMainWindow();

  const accelerator = "CommandOrControl+Alt+J";
  const ok = globalShortcut.register(accelerator, async () => {
    // Capture FIRST, before showing the window — otherwise focus moves to Electron
    // and we read our own (empty) input instead of whatever the user was typing in.
    let result = { hwnd: null, text: "" };
    try {
      result = await getSelection();
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
    console.error(`Failed to register global shortcut: ${accelerator}`);
  } else {
    console.log(`Registered global shortcut: ${accelerator}`);
  }
  if (!settings.apiKey) {
    console.warn(
      "API key not configured — user will be prompted via the Settings view.",
    );
  }
});

app.on("before-quit", () => {
  app.isQuitting = true;
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  // Don't quit the app, keep it running in the background
});
