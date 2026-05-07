const { execFile } = require("child_process");
const { clipboard } = require("electron");
const { PASTE_FOCUS_DELAY_MS } = require("./constants");

const CLIPBOARD_SETTLE_MS = 250;

function osascript(script) {
  return new Promise((resolve, reject) => {
    execFile("osascript", ["-e", script], (error, stdout) => {
      if (error) reject(error);
      else resolve(stdout.toString().trim());
    });
  });
}

async function getFrontmostPid() {
  const out = await osascript(`
    tell application "System Events"
      set p to first application process whose frontmost is true
      return unix id of p
    end tell
  `);
  return out;
}

async function sendCmdC() {
  await osascript(
    `tell application "System Events" to keystroke "c" using command down`,
  );
}

async function sendCmdV() {
  await osascript(
    `tell application "System Events" to keystroke "v" using command down`,
  );
}

async function activatePid(pid) {
  await osascript(`
    tell application "System Events"
      set frontmost of (first application process whose unix id is ${Number(pid)}) to true
    end tell
  `);
}

// No-op on Mac — AppleScript runs inline via osascript -e, no temp files.
function ensureScripts() {}

async function getSelection() {
  let pid = "";
  try {
    pid = await getFrontmostPid();
  } catch (e) {
    console.error("could not read frontmost app:", e);
  }

  const prev = clipboard.readText();
  clipboard.clear();

  try {
    await sendCmdC();
  } catch (e) {
    console.error("Cmd+C failed (Accessibility permission?):", e);
  }
  await new Promise((r) => setTimeout(r, CLIPBOARD_SETTLE_MS));

  const captured = clipboard.readText();
  if (prev) clipboard.writeText(prev);

  return { hwnd: pid, text: captured };
}

async function pasteIntoWindow(pid) {
  await activatePid(pid);
  await new Promise((r) => setTimeout(r, PASTE_FOCUS_DELAY_MS));
  await sendCmdV();
}

module.exports = { ensureScripts, getSelection, pasteIntoWindow };
