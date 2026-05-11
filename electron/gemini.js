const { GEMINI_API_BASE, REPHRASE_PROMPT } = require("./constants");
const settings = require("./settings");

async function rephrase(text) {
  const { apiKey, model } = settings.get();
  if (!apiKey) {
    throw new Error("API key not configured. Open Settings to add one.");
  }
  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: REPHRASE_PROMPT(text) }] }],
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

async function listModels(apiKey) {
  const key = apiKey || settings.get().apiKey;
  if (!key) throw new Error("API key required to list models");
  const url = `${GEMINI_API_BASE}?key=${encodeURIComponent(key)}&pageSize=1000`;
  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return (data.models || [])
    .filter(
      (m) =>
        typeof m.name === "string" &&
        m.name.startsWith("models/gemini-") &&
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes("generateContent"),
    )
    .map((m) => {
      const id = m.name.replace(/^models\//, "");
      return { value: id, label: m.displayName ? `${m.displayName} (${id})` : id };
    });
}

module.exports = { rephrase, listModels };
