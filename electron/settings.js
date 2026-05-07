const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const { DEFAULT_MODEL } = require("./constants");

let current = { apiKey: "", model: DEFAULT_MODEL };

function settingsFilePath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function loadFromDisk() {
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

function persist() {
  const p = settingsFilePath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(current, null, 2), "utf8");
}

function init() {
  const loaded = loadFromDisk();
  if (loaded) {
    current = loaded;
    return;
  }
  // First run — seed from .env if it has a key, then persist so future
  // launches use the on-disk file as the single source of truth.
  current = {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: DEFAULT_MODEL,
  };
  if (current.apiKey) persist();
}

function get() {
  return { ...current };
}

function update(incoming) {
  if (typeof incoming?.apiKey === "string") {
    current.apiKey = incoming.apiKey.trim();
  }
  if (typeof incoming?.model === "string" && incoming.model) {
    current.model = incoming.model;
  }
  persist();
  return get();
}

module.exports = { init, get, update };
