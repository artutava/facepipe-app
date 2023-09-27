const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
  'electron', {
      sendSync: ipcRenderer.sendSync
  }
);

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })
  
  window.onerror = (message, source, lineno, colno, error) => {
    console.error(`An error occurred: ${message} at ${source}:${lineno}:${colno}`, error);
};
