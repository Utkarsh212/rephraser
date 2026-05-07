const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onMessage: (callback) => ipcRenderer.on("message", callback),
  onCapturedText: (callback) => ipcRenderer.on("captured-text", callback),
  rephrase: (text) => ipcRenderer.invoke("rephrase", text),
  copy: (text) => ipcRenderer.invoke("copy", text),
  replace: (text) => ipcRenderer.invoke("replace", text),
});
