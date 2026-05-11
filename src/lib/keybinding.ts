const isMac =
  typeof window !== "undefined" && window.electronAPI?.platform === "darwin";

const MODIFIER_KEYS = new Set([
  "Control",
  "Alt",
  "Shift",
  "Meta",
  "Option",
  "Command",
]);

// Converts a DOM KeyboardEvent into an Electron accelerator string
// (https://www.electronjs.org/docs/latest/api/accelerator).
// Returns null when the event has no modifier or no main key — single-key
// shortcuts are too easy to trigger accidentally, so we require a modifier.
export function eventToAccelerator(e: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(e.key)) return null;

  const modifiers: string[] = [];
  if (e.ctrlKey) modifiers.push("Control");
  if (e.altKey) modifiers.push(isMac ? "Option" : "Alt");
  if (e.shiftKey) modifiers.push("Shift");
  if (e.metaKey) modifiers.push(isMac ? "Command" : "Super");

  if (modifiers.length === 0) return null;

  let key = e.key;
  if (key === " ") key = "Space";
  else if (key.length === 1) key = key.toUpperCase();
  // Otherwise leave as-is for named keys (Enter, Escape, ArrowUp, F1, etc.).

  return [...modifiers, key].join("+");
}

// Renders an Electron accelerator string as a human-readable label.
// macOS uses the conventional ⌘⌥⇧⌃ glyphs; other platforms use Ctrl/Alt/Shift.
export function acceleratorToLabel(accel: string): string {
  if (!accel) return "";
  if (isMac) {
    return accel
      .replace(/\bCommandOrControl\b/g, "⌘")
      .replace(/\bCmdOrCtrl\b/g, "⌘")
      .replace(/\bCommand\b/g, "⌘")
      .replace(/\bCmd\b/g, "⌘")
      .replace(/\bSuper\b/g, "⌘")
      .replace(/\bMeta\b/g, "⌘")
      .replace(/\bControl\b/g, "⌃")
      .replace(/\bCtrl\b/g, "⌃")
      .replace(/\bOption\b/g, "⌥")
      .replace(/\bAlt\b/g, "⌥")
      .replace(/\bShift\b/g, "⇧");
  }
  return accel
    .replace(/\bCommandOrControl\b/g, "Ctrl")
    .replace(/\bCmdOrCtrl\b/g, "Ctrl")
    .replace(/\bControl\b/g, "Ctrl")
    .replace(/\bCommand\b/g, "Win")
    .replace(/\bCmd\b/g, "Win")
    .replace(/\bSuper\b/g, "Win")
    .replace(/\bMeta\b/g, "Win")
    .replace(/\bOption\b/g, "Alt");
}
