import { useEffect, useState } from "react";
import { Keyboard, RotateCcw } from "lucide-react";
import { acceleratorToLabel, eventToAccelerator } from "../../lib/keybinding";
import { DEFAULT_SHORTCUT, STRINGS } from "../../lib/constants";
import { resumeShortcut, suspendShortcut } from "../../lib/api";
import { Button } from "./Button";

type Props = {
  value: string;
  onChange: (accelerator: string) => void;
};

export function ShortcutInput({ value, onChange }: Props) {
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (!recording) return;

    // Release the registered global shortcut so the OS doesn't swallow the
    // keystroke the user is trying to record. The main process also starts
    // a watchdog timer that auto-restores the shortcut after 30s if we
    // somehow never call resumeShortcut.
    suspendShortcut().catch(() => {});

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setRecording(false);
        return;
      }
      const accel = eventToAccelerator(e);
      if (accel) {
        onChange(accel);
        setRecording(false);
      }
    };
    // If the Electron window loses focus, the user can't be recording
    // meaningfully — cancel so the cleanup re-registers the shortcut.
    const onBlur = () => setRecording(false);

    document.addEventListener("keydown", handler, true);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("keydown", handler, true);
      window.removeEventListener("blur", onBlur);
      resumeShortcut().catch(() => {});
    };
  }, [recording, onChange]);

  const canReset = value !== DEFAULT_SHORTCUT;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex-1 flex items-center gap-2 px-3 py-2 border rounded-lg text-sm bg-white/80 transition-colors ${
          recording
            ? "border-amber-500 ring-2 ring-amber-200"
            : "border-stone-200"
        }`}
      >
        <Keyboard className="w-4 h-4 text-stone-400 shrink-0" />
        {recording ? (
          <span className="text-stone-500 italic">
            {STRINGS.settings.shortcutPrompt}
          </span>
        ) : (
          <kbd className="font-mono text-stone-900">
            {acceleratorToLabel(value) || "—"}
          </kbd>
        )}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setRecording((r) => !r)}
      >
        {recording
          ? STRINGS.settings.shortcutCancel
          : STRINGS.settings.shortcutRecord}
      </Button>
      {canReset && !recording && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={() => onChange(DEFAULT_SHORTCUT)}
          title={STRINGS.settings.shortcutReset}
          aria-label={STRINGS.settings.shortcutReset}
        >
          Reset
        </Button>
      )}
    </div>
  );
}
