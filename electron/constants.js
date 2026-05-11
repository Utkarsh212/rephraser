const path = require("path");
const os = require("os");

const DEFAULT_SHORTCUT = "CommandOrControl+Alt+J";
const DEFAULT_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEV_SERVER_URL = "http://localhost:5173";
const DEV_FLAG = "--dev";
const PASTE_FOCUS_DELAY_MS = 120;

const REPHRASE_PROMPT = (text) =>
  `Rephrase the following text. Respond with ONLY the rephrased version — no preamble, no quotes, no explanation:\n\n${text}`;

const SCRIPTS_DIR = path.join(__dirname, "scripts");
const CAPTURE_SCRIPT_SRC = path.join(SCRIPTS_DIR, "capture.ps1");
const REPLACE_SCRIPT_SRC = path.join(SCRIPTS_DIR, "replace.ps1");
// Scripts run from %TEMP% so PowerShell can execute them even when the app
// is packaged inside an .asar archive (PowerShell can't read inside asar).
const CAPTURE_SCRIPT_TMP = path.join(os.tmpdir(), "electron-app-capture.ps1");
const REPLACE_SCRIPT_TMP = path.join(os.tmpdir(), "electron-app-replace.ps1");

module.exports = {
  DEFAULT_SHORTCUT,
  DEFAULT_MODEL,
  GEMINI_API_BASE,
  DEV_SERVER_URL,
  DEV_FLAG,
  PASTE_FOCUS_DELAY_MS,
  REPHRASE_PROMPT,
  CAPTURE_SCRIPT_SRC,
  REPLACE_SCRIPT_SRC,
  CAPTURE_SCRIPT_TMP,
  REPLACE_SCRIPT_TMP,
};
