import { Settings as SettingsIcon, Wand2, X } from "lucide-react";
import { useUiStore } from "../store/uiStore";
import { useSettings } from "../lib/queries";
import { SHORTCUT_LABEL, STRINGS } from "../lib/constants";

export function Header() {
  const view = useUiStore((s) => s.view);
  const setView = useUiStore((s) => s.setView);
  const { data: settings } = useSettings();
  const canCloseSettings = view === "settings" && !!settings?.hasApiKey;

  return (
    <header className="flex items-center justify-between mb-6 pt-1">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-amber-700 flex items-center justify-center text-white shadow-sm shadow-orange-500/20">
          <Wand2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-stone-900 leading-tight">
            {STRINGS.header.title}
          </h1>
          <p className="text-xs text-stone-500">
            {STRINGS.header.hintPrefix}{" "}
            <kbd className="px-1 py-0.5 text-[10px] font-mono bg-stone-100 border border-stone-200 rounded text-stone-700">
              {SHORTCUT_LABEL}
            </kbd>{" "}
            {STRINGS.header.hintSuffix}
          </p>
        </div>
      </div>

      {view === "main" && (
        <button
          type="button"
          onClick={() => setView("settings")}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50"
          title={STRINGS.settings.title}
          aria-label="Open settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      )}
      {canCloseSettings && (
        <button
          type="button"
          onClick={() => setView("main")}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-stone-600 hover:bg-stone-200/60 hover:text-stone-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50"
          title="Close settings"
          aria-label="Close settings"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </header>
  );
}
