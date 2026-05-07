const fs = require("fs");
const { execFile } = require("child_process");
const {
  CAPTURE_SCRIPT_SRC,
  CAPTURE_SCRIPT_TMP,
  REPLACE_SCRIPT_SRC,
  REPLACE_SCRIPT_TMP,
} = require("./constants");

const POWERSHELL_ARGS = [
  "-NoProfile",
  "-STA",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
];

// Copy the .ps1 sources to %TEMP% so PowerShell can execute them even when
// the source files live inside an .asar archive.
function ensureScripts() {
  fs.writeFileSync(CAPTURE_SCRIPT_TMP, fs.readFileSync(CAPTURE_SCRIPT_SRC));
  fs.writeFileSync(REPLACE_SCRIPT_TMP, fs.readFileSync(REPLACE_SCRIPT_SRC));
}

function getSelection() {
  return new Promise((resolve) => {
    execFile(
      "powershell.exe",
      [...POWERSHELL_ARGS, CAPTURE_SCRIPT_TMP],
      { maxBuffer: 10 * 1024 * 1024, windowsHide: true },
      (error, stdout) => {
        if (error) {
          console.error("capture failed:", error);
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
      [...POWERSHELL_ARGS, REPLACE_SCRIPT_TMP, "-Hwnd", String(hwnd)],
      { windowsHide: true },
      (error) => {
        if (error) reject(error);
        else resolve();
      },
    );
  });
}

module.exports = { ensureScripts, getSelection, pasteIntoWindow };
