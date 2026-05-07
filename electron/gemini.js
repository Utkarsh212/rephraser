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

module.exports = { rephrase };
