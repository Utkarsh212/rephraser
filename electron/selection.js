// Platform dispatcher — main.js imports from here and gets the right impl.
const { platform } = process;

if (platform === "win32") {
  module.exports = require("./selection.win");
} else if (platform === "darwin") {
  module.exports = require("./selection.mac");
} else {
  const unsupported = () =>
    Promise.reject(new Error(`Platform "${platform}" is not supported.`));
  module.exports = {
    ensureScripts: () => {},
    getSelection: unsupported,
    pasteIntoWindow: unsupported,
  };
}
