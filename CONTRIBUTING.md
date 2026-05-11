# Contributing to Rephraser

Thanks for poking around. This document covers everything you need to run Rephraser locally, build installers, and work on the codebase.

If you're just trying to *use* the app, head back to the [README](./README.md).

---

## Prerequisites

- Node.js 18+
- npm
- A [Gemini API key](https://aistudio.google.com/apikey)
- (Windows only) **Developer Mode** enabled if you plan to build installers. See [Building installers](#building-installers).

---

## Setup

```bash
git clone https://github.com/<you>/rephraser.git
cd rephraser
npm install
```

---

## Run in dev mode

```bash
npm run dev
```

This spawns Vite (renderer hot reload) **and** `nodemon` watching `main.js`, `preload.js`, and the `electron/` folder. Electron restarts automatically when main-process files change.

What hot-reloads vs. what restarts:

| Change | Behavior |
|---|---|
| `src/**` (React/TS) | Vite HMR, instant patch, no reload |
| `main.js` / `preload.js` / `electron/**` | Electron process restarts via nodemon |
| `package.json` scripts | Manual restart of `npm run dev` |

---

## Type-check

```bash
npm run typecheck
```

Runs `tsc --noEmit`. CI-friendly. There are no runtime tests yet; type safety is the primary guardrail.

---

## Available scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite + Electron with full hot reload |
| `npm run build` | Build the renderer bundle to `dist/` |
| `npm start` | Build + launch in production mode |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run pack` | Builds an unpacked app in `release/<platform>-unpacked/` for testing |
| `npm run dist` | Installer for current platform |
| `npm run dist:win` / `:mac` / `:linux` | Platform-specific installer |

---

## Project layout

```
electron-app/
├── main.js                  # Electron entry: app lifecycle, IPC wiring
├── preload.js               # Context bridge for window.electronAPI
├── electron/
│   ├── constants.js         # Shortcut default, model, prompt, paths
│   ├── env.js               # First-run .env loader
│   ├── settings.js          # JSON persistence in userData
│   ├── gemini.js            # Gemini API client
│   ├── selection.js         # Platform dispatcher
│   ├── selection.win.js     # Windows: PowerShell + Win32
│   ├── selection.mac.js     # macOS: osascript
│   └── scripts/
│       ├── capture.ps1
│       └── replace.ps1
└── src/                     # Vite + React renderer
    ├── App.tsx
    ├── main.tsx
    ├── components/
    │   ├── AppShell.tsx     # Gradient background
    │   ├── Header.tsx       # Branded header + Settings button
    │   ├── MainView.tsx     # Capture + rephrase workflow
    │   ├── SettingsView.tsx # Formik settings form
    │   └── ui/              # Button, Card, EmptyState, …
    ├── store/uiStore.ts     # Zustand
    ├── lib/
    │   ├── api.ts           # Typed window.electronAPI wrappers
    │   ├── queries.ts       # TanStack Query hooks
    │   ├── keybinding.ts    # Accelerator <-> KeyboardEvent helpers
    │   └── constants.ts     # UI strings + defaults
    └── types.ts
```

Renderer code is **TypeScript + React**. Main process is **CommonJS** (it has to stay CJS so it can `require("electron")` and friends).

---

## Building installers

### Windows

```bash
npm run dist:win
```

Produces `release/Rephraser Setup x.y.z.exe` (NSIS installer) and `release/Rephraser-x.y.z-win.zip` (portable).

> ⚠️ Windows needs **Developer Mode** enabled (Settings → System → For developers) so electron-builder can extract symlinks from `winCodeSign`. Otherwise the build fails partway through.

### macOS

```bash
npm run dist:mac
```

Produces a `.dmg` (on macOS) or `.zip` (on Windows/Linux, since `hdiutil` isn't available cross-platform). The resulting app is **unsigned**, so recipients will need to bypass Gatekeeper (see the README's Install/macOS section).

### Linux

```bash
npm run dist:linux
```

Produces an `.AppImage`.

### App icon

Drop your icons in `build/`:
- `build/icon.ico` for Windows (256×256)
- `build/icon.icns` for macOS
- `build/icon.png` for Linux (512×512)

Without these, the default Electron icon is used.

---

## Dev-time troubleshooting

### electron-builder fails with "Cannot create symbolic link"

Enable Windows Developer Mode (Settings → System → For developers), then clear the cache:

```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
npm run dist:win
```

### Vite says "page reload main.js" but my main-process change isn't picked up

`nodemon` should auto-restart Electron when files in `main.js`, `preload.js`, or `electron/` change. If it doesn't, just quit `npm run dev` (Ctrl+C) and re-run.

### IPC error: "No handler registered for X"

Means the renderer is calling a handler that doesn't exist in the currently-running main process. Almost always caused by editing `main.js` while a stale Electron process is still up. `nodemon` should catch this, but if you see it persist, kill `npm run dev` and start fresh.

### Shortcut recording captures nothing

If you're trying to record a combo that's currently the *registered* global shortcut (e.g. you held the existing default while recording), the OS swallows it before the renderer sees it. The app already calls `suspendShortcut` while the recorder is open to mitigate this. If you still see it: confirm a fresh main process is running and that `suspendShortcut` / `resumeShortcut` IPC handlers exist.

---

## Code conventions

- **No unused props / dead code.** UI primitives in `src/components/ui/` are intentionally minimal. If you need an `action` slot on `SectionHeader` again, add it back when you have a real caller.
- **Comments explain *why*, not *what*.** The codebase has a few non-obvious bits (Win32 `AttachThreadInput`, capture-before-show ordering, asar-aware script copying) that have short comments. Drive-by comments that just restate the code aren't welcome.
- **Constants live in dedicated files.**
  - Main-process constants: `electron/constants.js`
  - Renderer constants: `src/lib/constants.ts`
- **Cross-platform code dispatches through `electron/selection.js`.** Add Linux support there if you ever need it.

---

## Submitting changes

1. Fork → branch from `main`.
2. `npm install && npm run typecheck` should pass before you push.
3. Manual smoke-test the rephrase + replace flow in your platform of choice.
4. Open a PR with a screenshot or short clip if you touched the UI.

That's it. Have fun.
