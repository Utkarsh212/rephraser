const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  onCapturedText: (callback) => {
    ipcRenderer.on("captured-text", callback);
    return () => ipcRenderer.removeListener("captured-text", callback);
  },
  rephrase: (text) => ipcRenderer.invoke("rephrase", text),
  copy: (text) => ipcRenderer.invoke("copy", text),
  replace: (text) => ipcRenderer.invoke("replace", text),
  getSettings: () => ipcRenderer.invoke("getSettings"),
  saveSettings: (settings) => ipcRenderer.invoke("saveSettings", settings),
  suspendShortcut: () => ipcRenderer.invoke("suspendShortcut"),
  resumeShortcut: () => ipcRenderer.invoke("resumeShortcut"),
});
